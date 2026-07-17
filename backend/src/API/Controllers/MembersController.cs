using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Members;
using GymSaaS.Application.Services;
using GymSaaS.Domain.Entities;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/members")]
[Authorize(Policy = "TenantStaff")]
public sealed class MembersController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;
    private readonly IMembershipStatusService _membershipStatusService;

    public MembersController(
        GymSaaSDbContext dbContext,
        ITenantProvider tenantProvider,
        IMembershipStatusService membershipStatusService)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
        _membershipStatusService = membershipStatusService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MemberDto>>> GetAll(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var members = await _dbContext.Members
            .AsNoTracking()
            .Where(member => member.IsActive)
            .Include(member => member.Subscriptions)
                .ThenInclude(subscription => subscription.Plan)
            .OrderBy(member => member.FirstName)
            .ThenBy(member => member.LastName)
            .ToListAsync(cancellationToken);

        var dtos = members.Select(member => ToDto(member, LatestSubscription(member), today)).ToList();
        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<MemberDto>> Create(CreateMemberRequest request, CancellationToken cancellationToken)
    {
        var fullName = (request.FullName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest("El nombre del miembro es obligatorio.");
        }

        var tenantId = _tenantProvider.CurrentTenantId;
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant();

        if (email is not null)
        {
            var duplicate = await _dbContext.Members.AnyAsync(member => member.Email == email, cancellationToken);
            if (duplicate)
            {
                return Conflict("Ya existe un miembro con este correo.");
            }
        }

        var (firstName, lastName) = SplitName(fullName);
        var member = new Member
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            Phone = Clean(request.Phone),
            Gender = Clean(request.Gender),
            Age = request.Age,
            HeightCm = request.HeightCm,
            WeightKg = request.WeightKg,
            ChestCm = request.ChestCm,
            ArmCm = request.ArmCm,
            WaistCm = request.WaistCm,
            HipCm = request.HipCm,
            LegCm = request.LegCm
        };
        _dbContext.Members.Add(member);

        Subscription? subscription = null;
        if (!string.IsNullOrWhiteSpace(request.PlanName))
        {
            var plan = await ResolvePlanAsync(tenantId, request.PlanName.Trim(), request.SubscriptionValue, cancellationToken);
            var start = request.StartDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            subscription = new Subscription
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                MemberId = member.Id,
                PlanId = plan.Id,
                StartDate = start,
                EndDate = start.AddDays(plan.DurationDays),
                Status = SubscriptionStatus.Active,
                ActivatedAt = DateTimeOffset.UtcNow,
                Plan = plan
            };
            _dbContext.Subscriptions.Add(subscription);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(ToDto(member, subscription, today));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MemberDto>> Update(Guid id, UpdateMemberRequest request, CancellationToken cancellationToken)
    {
        var member = await _dbContext.Members
            .Include(m => m.Subscriptions)
                .ThenInclude(subscription => subscription.Plan)
            .SingleOrDefaultAsync(m => m.Id == id && m.IsActive, cancellationToken);

        if (member is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            var (firstName, lastName) = SplitName(request.FullName.Trim());
            member.FirstName = firstName;
            member.LastName = lastName;
        }

        if (request.Email is not null)
        {
            var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant();
            if (email is not null && email != member.Email)
            {
                var duplicate = await _dbContext.Members.AnyAsync(m => m.Email == email && m.Id != id, cancellationToken);
                if (duplicate)
                {
                    return Conflict("Ya existe un miembro con este correo.");
                }
            }

            member.Email = email;
        }

        if (request.Phone is not null) member.Phone = Clean(request.Phone);
        if (request.Gender is not null) member.Gender = Clean(request.Gender);
        if (request.Age.HasValue) member.Age = request.Age;
        if (request.HeightCm.HasValue) member.HeightCm = request.HeightCm;
        if (request.WeightKg.HasValue) member.WeightKg = request.WeightKg;
        if (request.ChestCm.HasValue) member.ChestCm = request.ChestCm;
        if (request.ArmCm.HasValue) member.ArmCm = request.ArmCm;
        if (request.WaistCm.HasValue) member.WaistCm = request.WaistCm;
        if (request.HipCm.HasValue) member.HipCm = request.HipCm;
        if (request.LegCm.HasValue) member.LegCm = request.LegCm;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(ToDto(member, LatestSubscription(member), today));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var member = await _dbContext.Members.SingleOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (member is null)
        {
            return NotFound();
        }

        // Soft delete: keep financial/attendance history intact, drop the member from listings.
        member.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/membership")]
    public async Task<ActionResult<MemberDto>> UpdateMembership(Guid id, UpdateMembershipRequest request, CancellationToken cancellationToken)
    {
        if (request.EndDate < request.StartDate)
        {
            return BadRequest("La fecha de fin no puede ser anterior a la de inicio.");
        }

        var member = await _dbContext.Members
            .Include(m => m.Subscriptions)
                .ThenInclude(subscription => subscription.Plan)
            .SingleOrDefaultAsync(m => m.Id == id && m.IsActive, cancellationToken);

        if (member is null)
        {
            return NotFound();
        }

        var subscription = LatestSubscription(member);
        if (subscription is null)
        {
            return Conflict("El miembro no tiene una mensualidad registrada.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Renewing may also switch the member to a different plan.
        if (!string.IsNullOrWhiteSpace(request.PlanName) &&
            !string.Equals(subscription.Plan?.Name, request.PlanName.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var plan = await ResolvePlanAsync(_tenantProvider.CurrentTenantId, request.PlanName.Trim(), null, cancellationToken);
            subscription.PlanId = plan.Id;
            subscription.Plan = plan;
        }

        subscription.StartDate = request.StartDate;
        subscription.EndDate = request.EndDate;
        if (subscription.Status is not SubscriptionStatus.Suspended and not SubscriptionStatus.Cancelled)
        {
            subscription.Status = subscription.EndDate >= today ? SubscriptionStatus.Active : SubscriptionStatus.Expired;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(member, subscription, today));
    }

    [HttpPost("{id:guid}/suspend")]
    public async Task<ActionResult<MemberDto>> ToggleSuspend(Guid id, CancellationToken cancellationToken)
    {
        var member = await _dbContext.Members
            .Include(m => m.Subscriptions)
                .ThenInclude(subscription => subscription.Plan)
            .SingleOrDefaultAsync(m => m.Id == id && m.IsActive, cancellationToken);

        if (member is null)
        {
            return NotFound();
        }

        var subscription = LatestSubscription(member);
        if (subscription is null)
        {
            return Conflict("El miembro no tiene una mensualidad registrada.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (subscription.Status == SubscriptionStatus.Suspended)
        {
            subscription.Status = subscription.EndDate >= today ? SubscriptionStatus.Active : SubscriptionStatus.Expired;
        }
        else
        {
            subscription.Status = SubscriptionStatus.Suspended;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(member, subscription, today));
    }

    private static Subscription? LatestSubscription(Member member) =>
        member.Subscriptions
            .OrderByDescending(subscription => subscription.EndDate)
            .ThenByDescending(subscription => subscription.CreatedAt)
            .FirstOrDefault();

    private async Task<Plan> ResolvePlanAsync(Guid tenantId, string planName, decimal? price, CancellationToken cancellationToken)
    {
        var plan = await _dbContext.Plans.SingleOrDefaultAsync(p => p.Name == planName, cancellationToken);
        if (plan is null)
        {
            plan = new Plan
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = planName,
                Price = price ?? 0m,
                Currency = "COP",
                DurationDays = DurationForPlanName(planName),
                IsActive = true
            };
            _dbContext.Plans.Add(plan);
        }
        else if (price is decimal value && value > 0m && plan.Price == 0m)
        {
            plan.Price = value;
        }

        return plan;
    }

    private static int DurationForPlanName(string name) => name.Trim().ToLowerInvariant() switch
    {
        "diario" => 1,
        "semanal" => 7,
        "quincenal" => 15,
        "mensual" => 30,
        "trimestral" => 90,
        "semestral" => 180,
        "anual" => 365,
        "vip" => 30,
        _ => 30
    };

    private static (string FirstName, string LastName) SplitName(string fullName)
    {
        var parts = fullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length switch
        {
            >= 2 => (parts[0], parts[1]),
            1 => (parts[0], string.Empty),
            _ => (fullName, string.Empty)
        };
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private MemberDto ToDto(Member member, Subscription? subscription, DateOnly today)
    {
        var bodyMetrics = new MemberBodyMetricsDto(
            member.HeightCm, member.WeightKg, member.ChestCm, member.ArmCm, member.WaistCm, member.HipCm, member.LegCm);

        if (subscription is null)
        {
            return new MemberDto(
                member.Id, member.FullName, member.Email, member.Phone, member.Gender, member.Age,
                null, null, null, null, 0,
                MemberStatus.Pending.ToString(),
                _membershipStatusService.GetVisualColor(MemberStatus.Pending),
                _membershipStatusService.GetTailwindClass(MemberStatus.Pending),
                bodyMetrics);
        }

        var status = _membershipStatusService.GetStatus(subscription.EndDate, today, subscription.Status);
        var daysToExpire = _membershipStatusService.GetDaysToExpire(subscription.EndDate, today);

        return new MemberDto(
            member.Id, member.FullName, member.Email, member.Phone, member.Gender, member.Age,
            subscription.PlanId, subscription.Plan?.Name,
            subscription.StartDate, subscription.EndDate, daysToExpire,
            status.ToString(),
            _membershipStatusService.GetVisualColor(status),
            _membershipStatusService.GetTailwindClass(status),
            bodyMetrics);
    }
}
