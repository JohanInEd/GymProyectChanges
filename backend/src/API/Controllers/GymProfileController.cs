using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Gym;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/gym")]
[Authorize(Policy = "TenantStaff")]
public sealed class GymProfileController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;
    private readonly ISubscriptionAccessService _accessService;

    public GymProfileController(
        GymSaaSDbContext dbContext,
        ITenantProvider tenantProvider,
        ISubscriptionAccessService accessService)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
        _accessService = accessService;
    }

    [HttpGet]
    public async Task<ActionResult<GymProfileDto>> Get(CancellationToken cancellationToken)
    {
        var tenantId = _tenantProvider.CurrentTenantId;
        var gym = await _dbContext.Gyms.SingleOrDefaultAsync(g => g.Id == tenantId, cancellationToken);
        if (gym is null)
        {
            return NotFound();
        }

        var owner = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.TenantId == tenantId && u.Role == Role.Owner)
            .OrderBy(u => u.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var access = await _accessService.GetAccessAsync(tenantId, cancellationToken);
        return Ok(ToDto(gym, owner?.FullName, owner?.Email, owner?.Role, access));
    }

    [HttpPut]
    public async Task<ActionResult<GymProfileDto>> Update(UpdateGymProfileRequest request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantProvider.CurrentTenantId;
        var gym = await _dbContext.Gyms.SingleOrDefaultAsync(g => g.Id == tenantId, cancellationToken);
        if (gym is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.GymName)) gym.Name = request.GymName.Trim();
        if (request.Country is not null) gym.Country = string.IsNullOrWhiteSpace(request.Country) ? null : request.Country.Trim();
        if (request.City is not null) gym.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        if (request.Phone is not null) gym.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();

        var owner = await _dbContext.Users
            .Where(u => u.TenantId == tenantId && u.Role == Role.Owner)
            .OrderBy(u => u.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (owner is not null && !string.IsNullOrWhiteSpace(request.AdminName))
        {
            owner.FullName = request.AdminName.Trim();
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var access = await _accessService.GetAccessAsync(tenantId, cancellationToken);
        return Ok(ToDto(gym, owner?.FullName, owner?.Email, owner?.Role, access));
    }

    private static GymProfileDto ToDto(
        Domain.Entities.Gym gym,
        string? adminName,
        string? adminEmail,
        Role? adminRole,
        TenantAccess access) =>
        new(
            gym.Name,
            gym.Country,
            gym.City,
            gym.Phone,
            gym.Email,
            gym.SubscriptionPlan,
            gym.ApprovalStatus.ToString(),
            gym.TrialEndsAt,
            gym.EmailVerified,
            adminName ?? string.Empty,
            adminEmail ?? string.Empty,
            (adminRole ?? Role.Owner).ToString().ToLowerInvariant(),
            access.IsReadOnly ? "readOnly" : "full",
            access.Reason,
            access.EndDate);
}
