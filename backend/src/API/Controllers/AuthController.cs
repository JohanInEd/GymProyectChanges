using System.Net.Mail;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Auth;
using GymSaaS.Domain.Entities;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
[EnableRateLimiting("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly IInviteCodeService _inviteCodeService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthController(
        GymSaaSDbContext dbContext,
        IInviteCodeService inviteCodeService,
        IJwtTokenService jwtTokenService,
        IPasswordHasher<User> passwordHasher)
    {
        _dbContext = dbContext;
        _inviteCodeService = inviteCodeService;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = (request.Email ?? string.Empty).Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .SingleOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (user is null || !user.IsActive)
        {
            return Unauthorized("Correo o contrasena incorrectos.");
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password ?? string.Empty);
        if (verification == PasswordVerificationResult.Failed)
        {
            return Unauthorized("Correo o contrasena incorrectos.");
        }

        return Ok(new AuthResponse(_jwtTokenService.CreateToken(user), ToDto(user)));
    }

    [HttpPost("register-gym")]
    public async Task<ActionResult<AuthResponse>> RegisterGym(
        RegisterGymRequest request,
        CancellationToken cancellationToken)
    {
        var gymName = (request.GymName ?? string.Empty).Trim();
        var city = (request.City ?? string.Empty).Trim();
        var phone = (request.Phone ?? string.Empty).Trim();
        var ownerName = (request.OwnerName ?? string.Empty).Trim();
        var normalizedEmail = (request.Email ?? string.Empty).Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(gymName) || string.IsNullOrWhiteSpace(city) ||
            string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(ownerName))
        {
            return BadRequest("Todos los campos del gimnasio y el propietario son obligatorios.");
        }

        if (!IsValidEmail(normalizedEmail))
        {
            return BadRequest("El correo no es valido.");
        }

        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
        {
            return BadRequest("La contrasena debe tener al menos 8 caracteres.");
        }

        if (!request.AcceptTerms)
        {
            return BadRequest("Debes aceptar los terminos para continuar.");
        }

        if (string.IsNullOrWhiteSpace(request.InviteCode))
        {
            return BadRequest("Falta el codigo de invitacion.");
        }

        var emailTaken = await _dbContext.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (emailTaken)
        {
            return Conflict("Ya existe una cuenta con este correo.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var redemption = await _inviteCodeService.RedeemAsync(request.InviteCode, cancellationToken);
        if (!redemption.Success)
        {
            return Conflict(redemption.Message ?? "El codigo de invitacion no es valido.");
        }

        var slug = await GenerateUniqueSlugAsync(gymName, cancellationToken);

        var gym = new Gym
        {
            Id = Guid.NewGuid(),
            Name = gymName,
            Slug = slug,
            City = city,
            Phone = phone,
            Email = normalizedEmail
        };

        var owner = new User
        {
            Id = Guid.NewGuid(),
            TenantId = gym.Id,
            Email = normalizedEmail,
            FullName = ownerName,
            Role = Role.Owner,
            PasswordHash = string.Empty
        };
        owner.PasswordHash = _passwordHasher.HashPassword(owner, request.Password);

        _dbContext.Gyms.Add(gym);
        _dbContext.Users.Add(owner);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(new AuthResponse(_jwtTokenService.CreateToken(owner), ToDto(owner)));
    }

    private async Task<string> GenerateUniqueSlugAsync(string gymName, CancellationToken cancellationToken)
    {
        var baseSlug = Slugify(gymName);

        for (var attempt = 0; attempt < 5; attempt++)
        {
            var candidate = $"{baseSlug}-{RandomNumberGenerator.GetHexString(6, lowercase: true)}";
            var exists = await _dbContext.Gyms.AnyAsync(g => g.Slug == candidate, cancellationToken);
            if (!exists)
            {
                return candidate;
            }
        }

        throw new InvalidOperationException("Could not generate a unique gym slug.");
    }

    private static string Slugify(string value)
    {
        var lowered = value.Trim().ToLowerInvariant();
        var slug = Regex.Replace(lowered, "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "gym" : slug[..Math.Min(slug.Length, 50)];
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static AuthUserDto ToDto(User user) =>
        new(user.Id, user.TenantId, user.FullName, user.Email, user.Role.ToString().ToLowerInvariant());
}
