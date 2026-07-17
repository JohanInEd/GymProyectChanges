using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;

    public AuthController(
        GymSaaSDbContext dbContext,
        IInviteCodeService inviteCodeService,
        IJwtTokenService jwtTokenService,
        IPasswordHasher<User> passwordHasher,
        IEmailSender emailSender,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _inviteCodeService = inviteCodeService;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
        _emailSender = emailSender;
        _configuration = configuration;
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

    [HttpGet("me")]
    [Authorize]
    [DisableRateLimiting]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _dbContext.Users
            .SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        return Ok(ToDto(user));
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

        var planType = string.IsNullOrWhiteSpace(request.SubscriptionPlan)
            ? "trial"
            : request.SubscriptionPlan.Trim();

        var gym = new Gym
        {
            Id = Guid.NewGuid(),
            Name = gymName,
            Slug = slug,
            City = city,
            Phone = phone,
            Email = normalizedEmail,
            SubscriptionPlan = planType,
            ApprovalStatus = GymApprovalStatus.Pending,
            TrialEndsAt = DateTimeOffset.UtcNow.AddDays(14),
            EmailVerified = false
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

        var (rawVerifyToken, verifyTokenHash) = GenerateToken();
        var trialStart = DateOnly.FromDateTime(DateTime.UtcNow);

        _dbContext.Gyms.Add(gym);
        _dbContext.Users.Add(owner);
        _dbContext.UserTokens.Add(new UserToken
        {
            Id = Guid.NewGuid(),
            UserId = owner.Id,
            TokenHash = verifyTokenHash,
            Purpose = UserTokenPurpose.EmailVerification,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(3)
        });
        _dbContext.SaasSubscriptions.Add(new SaasSubscription
        {
            Id = Guid.NewGuid(),
            TenantId = gym.Id,
            PlanType = planType,
            StartDate = trialStart,
            EndDate = trialStart.AddDays(14),
            Status = SaasSubscriptionStatus.Trial
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        // Side effect after the transaction commits (never inside it).
        await SendVerificationEmailAsync(owner.Email, rawVerifyToken, cancellationToken);

        return Ok(new AuthResponse(_jwtTokenService.CreateToken(owner), ToDto(owner)));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user is not null && user.IsActive)
        {
            var (rawToken, tokenHash) = GenerateToken();
            _dbContext.UserTokens.Add(new UserToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = tokenHash,
                Purpose = UserTokenPurpose.PasswordReset,
                ExpiresAt = DateTimeOffset.UtcNow.AddHours(1)
            });
            await _dbContext.SaveChangesAsync(cancellationToken);

            var link = $"{FrontendBaseUrl()}/?reset={rawToken}";
            await _emailSender.SendAsync(
                user.Email,
                "Restablece tu contrasena - GymAssist",
                $"Recibimos una solicitud para restablecer tu contrasena. Abre este enlace (expira en 1 hora): <a href=\"{link}\">{link}</a>. Si no fuiste tu, ignora este correo.",
                cancellationToken);
        }

        // Always the same response so this cannot be used to discover which emails exist.
        return Ok(new { message = "Si el correo esta registrado, enviaremos instrucciones para restablecer la contrasena." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
        {
            return BadRequest("La contrasena debe tener al menos 8 caracteres.");
        }

        var rawToken = (request.Token ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return BadRequest("El enlace no es valido.");
        }

        var tokenHash = HashToken(rawToken);
        var token = await _dbContext.UserTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == tokenHash && t.Purpose == UserTokenPurpose.PasswordReset, cancellationToken);

        if (token is null || token.UsedAt is not null || token.ExpiresAt < DateTimeOffset.UtcNow || token.User is null)
        {
            return BadRequest("El enlace no es valido o ya expiro.");
        }

        token.User.PasswordHash = _passwordHasher.HashPassword(token.User, request.Password);
        token.UsedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Tu contrasena fue actualizada. Ya puedes iniciar sesion." });
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        var rawToken = (request.Token ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return BadRequest("El enlace no es valido.");
        }

        var tokenHash = HashToken(rawToken);
        var token = await _dbContext.UserTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == tokenHash && t.Purpose == UserTokenPurpose.EmailVerification, cancellationToken);

        if (token is null || token.UsedAt is not null || token.ExpiresAt < DateTimeOffset.UtcNow || token.User is null)
        {
            return BadRequest("El enlace no es valido o ya expiro.");
        }

        token.UsedAt = DateTimeOffset.UtcNow;
        var gym = await _dbContext.Gyms.SingleOrDefaultAsync(g => g.Id == token.User.TenantId, cancellationToken);
        if (gym is not null)
        {
            gym.EmailVerified = true;
            gym.EmailVerifiedAt = DateTimeOffset.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Tu correo fue verificado." });
    }

    private string FrontendBaseUrl() => (_configuration["Frontend:BaseUrl"] ?? string.Empty).TrimEnd('/');

    private static (string Raw, string Hash) GenerateToken()
    {
        var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        return (raw, HashToken(raw));
    }

    private static string HashToken(string raw) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();

    private async Task SendVerificationEmailAsync(string email, string rawToken, CancellationToken cancellationToken)
    {
        var link = $"{FrontendBaseUrl()}/?verify={rawToken}";
        await _emailSender.SendAsync(
            email,
            "Verifica tu correo - GymAssist",
            $"Bienvenido a GymAssist. Confirma tu correo para activar tu cuenta: <a href=\"{link}\">{link}</a>",
            cancellationToken);
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
