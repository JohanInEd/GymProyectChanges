using GymSaaS.Application.DTOs.Dashboard;
using GymSaaS.Application.Services;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = "TenantStaff")]
public sealed class DashboardController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly IMembershipStatusService _membershipStatusService;

    public DashboardController(
        GymSaaSDbContext dbContext,
        IMembershipStatusService membershipStatusService)
    {
        _dbContext = dbContext;
        _membershipStatusService = membershipStatusService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(
        [FromQuery] MemberStatus? status,
        CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTimeOffset.UtcNow;
        var currentMonthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var previousMonthStart = currentMonthStart.AddMonths(-1);

        var currentMonthPaidPayments = _dbContext.Payments
            .AsNoTracking()
            .Where(payment =>
                payment.Status == PaymentStatus.Paid &&
                payment.PaidAt >= currentMonthStart &&
                payment.PaidAt < currentMonthStart.AddMonths(1));

        var previousMonthPaidPayments = _dbContext.Payments
            .AsNoTracking()
            .Where(payment =>
                payment.Status == PaymentStatus.Paid &&
                payment.PaidAt >= previousMonthStart &&
                payment.PaidAt < currentMonthStart);

        var currentMonthRevenue = await currentMonthPaidPayments
            .SumAsync(payment => (decimal?)payment.Amount, cancellationToken) ?? 0m;

        var previousMonthRevenue = await previousMonthPaidPayments
            .SumAsync(payment => (decimal?)payment.Amount, cancellationToken) ?? 0m;

        var recentPaymentEntities = await _dbContext.Payments
            .AsNoTracking()
            .Include(payment => payment.Member)
            .Include(payment => payment.Subscription)
                .ThenInclude(subscription => subscription!.Plan)
            .OrderByDescending(payment => payment.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        var recentPayments = recentPaymentEntities
            .Select(payment => new RecentPaymentDto(
                payment.Id,
                payment.Member == null ? "Unknown" : payment.Member.FullName,
                payment.Subscription == null || payment.Subscription.Plan == null
                    ? "Unknown"
                    : payment.Subscription.Plan.Name,
                payment.Amount,
                payment.Currency,
                payment.Status.ToString(),
                payment.CreatedAt,
                payment.PaidAt))
            .ToList();

        var subscriptions = await _dbContext.Subscriptions
            .AsNoTracking()
            .Include(subscription => subscription.Member)
            .Include(subscription => subscription.Plan)
            .Where(subscription => subscription.Member != null && subscription.Plan != null)
            .OrderBy(subscription => subscription.EndDate)
            .ToListAsync(cancellationToken);

        var members = subscriptions
            .Select(subscription =>
            {
                var membershipStatus = _membershipStatusService.GetStatus(subscription.EndDate, today, subscription.Status);
                var daysToExpire = _membershipStatusService.GetDaysToExpire(subscription.EndDate, today);

                return new MemberSubscriptionDto(
                    subscription.MemberId,
                    subscription.Member!.FullName,
                    subscription.Member.Email,
                    subscription.Plan!.Name,
                    subscription.StartDate,
                    subscription.EndDate,
                    daysToExpire,
                    membershipStatus.ToString(),
                    _membershipStatusService.GetVisualColor(membershipStatus),
                    _membershipStatusService.GetTailwindClass(membershipStatus));
            })
            .Where(member => status is null || member.Status == status.Value.ToString())
            .ToList();

        var financialSummary = new FinancialSummaryDto(
            currentMonthRevenue,
            previousMonthRevenue,
            currentMonthRevenue - previousMonthRevenue,
            await currentMonthPaidPayments.CountAsync(cancellationToken),
            recentPayments);

        return Ok(new DashboardSummaryDto(financialSummary, members));
    }
}
