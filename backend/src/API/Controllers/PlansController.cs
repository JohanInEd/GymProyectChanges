using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Plans;
using GymSaaS.Domain.Entities;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/plans")]
[Authorize(Policy = "TenantStaff")]
public sealed class PlansController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;

    public PlansController(GymSaaSDbContext dbContext, ITenantProvider tenantProvider)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PlanDto>>> GetAll(CancellationToken cancellationToken)
    {
        var plans = await _dbContext.Plans
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new PlanDto(p.Id, p.Name, p.Description, p.Price, p.Currency, p.DurationDays, p.MaxClasses, p.IsActive))
            .ToListAsync(cancellationToken);

        return Ok(plans);
    }

    [HttpPost]
    public async Task<ActionResult<PlanDto>> Save(SavePlanRequest request, CancellationToken cancellationToken)
    {
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("El nombre del plan es obligatorio.");
        }

        if (request.DurationDays <= 0)
        {
            return BadRequest("La duracion debe ser mayor a cero.");
        }

        // id-first, then name-based dedupe (mirrors the frontend upsert behavior).
        Plan? plan = null;
        if (request.Id is Guid id && id != Guid.Empty)
        {
            plan = await _dbContext.Plans.SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        plan ??= await _dbContext.Plans.SingleOrDefaultAsync(p => p.Name == name, cancellationToken);

        if (plan is null)
        {
            plan = new Plan
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantProvider.CurrentTenantId,
                Name = name,
                Currency = "COP"
            };
            _dbContext.Plans.Add(plan);
        }

        plan.Name = name;
        plan.Description = request.Description?.Trim();
        plan.Price = request.Price;
        plan.DurationDays = request.DurationDays;
        plan.MaxClasses = request.MaxClasses;
        plan.IsActive = true;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new PlanDto(plan.Id, plan.Name, plan.Description, plan.Price, plan.Currency, plan.DurationDays, plan.MaxClasses, plan.IsActive));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var plan = await _dbContext.Plans.SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (plan is null)
        {
            return NotFound();
        }

        var inUse = await _dbContext.Subscriptions.AnyAsync(s => s.PlanId == id, cancellationToken);
        if (inUse)
        {
            // Preserve subscription history: hide the plan instead of a hard delete.
            plan.IsActive = false;
        }
        else
        {
            _dbContext.Plans.Remove(plan);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
