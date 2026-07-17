using System.Security.Claims;
using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Staff;
using GymSaaS.Domain.Entities;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Policy = "TenantStaff")]
public sealed class StaffController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;
    private readonly IPasswordHasher<User> _passwordHasher;

    public StaffController(
        GymSaaSDbContext dbContext,
        ITenantProvider tenantProvider,
        IPasswordHasher<User> passwordHasher)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
        _passwordHasher = passwordHasher;
    }

    private Guid CurrentUserId =>
        Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : Guid.Empty;

    private bool CurrentUserCanManage =>
        User.IsInRole(Role.Owner.ToString()) || User.IsInRole(Role.Admin.ToString());

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StaffUserDto>>> GetAll(CancellationToken cancellationToken)
    {
        // Users are intentionally not tenant-query-filtered (login resolves tenant from email),
        // so scope the listing to the caller's tenant explicitly.
        var tenantId = _tenantProvider.CurrentTenantId;
        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.FullName)
            .Select(u => new StaffUserDto(u.Id, u.FullName, u.Email, u.Role.ToString().ToLowerInvariant(), u.IsActive))
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<StaffUserDto>> Create(CreateStaffRequest request, CancellationToken cancellationToken)
    {
        if (!CurrentUserCanManage)
        {
            return Forbid();
        }

        var name = (request.Name ?? string.Empty).Trim();
        var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("El nombre es obligatorio.");
        }

        if (!Enum.TryParse<Role>(request.Role, ignoreCase: true, out var role))
        {
            return BadRequest("El rol no es valido.");
        }

        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
        {
            return BadRequest("La contrasena debe tener al menos 8 caracteres.");
        }

        var emailTaken = await _dbContext.Users.AnyAsync(u => u.Email == email, cancellationToken);
        if (emailTaken)
        {
            return Conflict("Ya existe una cuenta con este correo.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantProvider.CurrentTenantId,
            Email = email,
            FullName = name,
            Role = role,
            IsActive = true,
            PasswordHash = string.Empty
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new StaffUserDto(user.Id, user.FullName, user.Email, user.Role.ToString().ToLowerInvariant(), user.IsActive));
    }

    [HttpPost("{id:guid}/toggle")]
    public async Task<ActionResult<StaffUserDto>> Toggle(Guid id, CancellationToken cancellationToken)
    {
        if (!CurrentUserCanManage)
        {
            return Forbid();
        }

        if (id == CurrentUserId)
        {
            return Conflict("No puedes desactivar tu propia cuenta.");
        }

        var tenantId = _tenantProvider.CurrentTenantId;
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == id && u.TenantId == tenantId, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        user.IsActive = !user.IsActive;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new StaffUserDto(user.Id, user.FullName, user.Email, user.Role.ToString().ToLowerInvariant(), user.IsActive));
    }
}
