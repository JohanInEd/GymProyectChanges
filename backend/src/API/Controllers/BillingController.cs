using GymSaaS.Application.DTOs.Billing;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

/// <summary>
/// The gym's own SaaS billing (its subscription to the platform and its invoices).
/// Read-only on purpose: invoices are issued by the platform operator, never self-served by the
/// customer, so there is deliberately no create/update endpoint here (same reasoning as invite
/// codes). Both entities are tenant-query-filtered, so a gym can only ever see its own.
/// </summary>
[ApiController]
[Route("api/billing")]
[Authorize(Policy = "TenantStaff")]
public sealed class BillingController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;

    public BillingController(GymSaaSDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<BillingDto>> Get(CancellationToken cancellationToken)
    {
        var subscription = await _dbContext.SaasSubscriptions
            .AsNoTracking()
            .OrderByDescending(s => s.EndDate)
            .ThenByDescending(s => s.CreatedAt)
            .Select(s => new SaasSubscriptionDto(s.Id, s.PlanType, s.StartDate, s.EndDate, s.Status.ToString()))
            .FirstOrDefaultAsync(cancellationToken);

        var invoices = await _dbContext.SaasInvoices
            .AsNoTracking()
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => new SaasInvoiceDto(
                i.Id,
                i.Amount,
                i.Currency,
                i.IssuedAt,
                i.DueDate,
                i.PaidAt,
                i.Status.ToString(),
                i.InvoiceUrl))
            .ToListAsync(cancellationToken);

        return Ok(new BillingDto(subscription, invoices));
    }
}
