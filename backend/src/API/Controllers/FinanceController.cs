using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Finance;
using GymSaaS.Domain.Entities;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/finance")]
[Authorize(Policy = "TenantStaff")]
public sealed class FinanceController : ControllerBase
{
    private static readonly string[] MonthAbbreviations =
        { "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" };

    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;

    public FinanceController(GymSaaSDbContext dbContext, ITenantProvider tenantProvider)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<FinanceSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var currentMonthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var sixMonthsStart = currentMonthStart.AddMonths(-5);
        var previousMonthStart = currentMonthStart.AddMonths(-1);

        var paidPayments = await _dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Paid && p.PaidAt != null)
            .Include(p => p.Member)
            .Include(p => p.Subscription).ThenInclude(s => s!.Plan)
            .ToListAsync(cancellationToken);

        var expenses = await _dbContext.Expenses.AsNoTracking().ToListAsync(cancellationToken);
        var memberCreationDates = await _dbContext.Members
            .AsNoTracking()
            .Select(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        var currentMonthRevenue = paidPayments
            .Where(p => p.PaidAt >= currentMonthStart && p.PaidAt < currentMonthStart.AddMonths(1))
            .Sum(p => p.Amount);
        var previousMonthRevenue = paidPayments
            .Where(p => p.PaidAt >= previousMonthStart && p.PaidAt < currentMonthStart)
            .Sum(p => p.Amount);
        var currentMonthPaidPayments = paidPayments
            .Count(p => p.PaidAt >= currentMonthStart && p.PaidAt < currentMonthStart.AddMonths(1));
        var currentMonthExpenses = expenses
            .Where(e => e.ExpenseDate.Year == today.Year && e.ExpenseDate.Month == today.Month)
            .Sum(e => e.Amount);

        var monthlyRevenue = new List<MonthlyPointDto>();
        for (var i = 0; i < 6; i++)
        {
            var monthStart = sixMonthsStart.AddMonths(i);
            var monthEnd = monthStart.AddMonths(1);
            var revenue = paidPayments.Where(p => p.PaidAt >= monthStart && p.PaidAt < monthEnd).Sum(p => p.Amount);
            var monthExpenses = expenses
                .Where(e => e.ExpenseDate.Year == monthStart.Year && e.ExpenseDate.Month == monthStart.Month)
                .Sum(e => e.Amount);
            var users = memberCreationDates.Count(created => created < monthEnd);
            monthlyRevenue.Add(new MonthlyPointDto(MonthAbbreviations[monthStart.Month - 1], revenue, monthExpenses, users));
        }

        // Historia mes a mes desde el primer movimiento registrado, para que el panel pueda
        // filtrar por año. Se calcula aqui y no en el frontend porque la linea de usuarios
        // cuenta todos los miembros, incluidos los dados de baja, y la lista que recibe el
        // frontend solo trae los activos: derivarla alli daria otro numero.
        var revenueByMonth = paidPayments
            .Where(p => p.PaidAt != null)
            .GroupBy(p =>
            {
                var utc = p.PaidAt!.Value.ToUniversalTime();
                return (utc.Year, utc.Month);
            })
            .ToDictionary(g => g.Key, g => g.Sum(p => p.Amount));

        var expensesByMonth = expenses
            .GroupBy(e => (e.ExpenseDate.Year, e.ExpenseDate.Month))
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

        var monthlyHistory = new List<MonthlyHistoryPointDto>();
        var firstMovement = revenueByMonth.Keys
            .Concat(expensesByMonth.Keys)
            .Select(key => new DateTimeOffset(key.Year, key.Month, 1, 0, 0, 0, TimeSpan.Zero))
            .DefaultIfEmpty(currentMonthStart)
            .Min();

        // Nunca pasa del mes actual: un movimiento con fecha futura no debe dibujar meses vacios.
        var earliest = firstMovement < currentMonthStart ? firstMovement : currentMonthStart;
        // Arranca en enero de ese año: al filtrar por año se espera el año completo y dos
        // años comparables entre si, no un 2025 que empieza en marzo porque ese fue el
        // primer pago. El año en curso se corta solo, al llegar al mes actual.
        var historyStart = new DateTimeOffset(earliest.Year, 1, 1, 0, 0, 0, TimeSpan.Zero);
        for (var month = historyStart; month <= currentMonthStart; month = month.AddMonths(1))
        {
            var key = (month.Year, month.Month);
            var monthEnd = month.AddMonths(1);
            monthlyHistory.Add(new MonthlyHistoryPointDto(
                month.Year,
                month.Month,
                MonthAbbreviations[month.Month - 1],
                revenueByMonth.TryGetValue(key, out var monthRevenue) ? monthRevenue : 0m,
                expensesByMonth.TryGetValue(key, out var monthTotal) ? monthTotal : 0m,
                memberCreationDates.Count(created => created < monthEnd)));
        }

        var accountsReceivable = await _dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Pending)
            .Include(p => p.Member)
            .Include(p => p.Subscription).ThenInclude(s => s!.Plan)
            .OrderBy(p => p.CreatedAt)
            .Select(p => new ReceivableDto(
                p.Id,
                p.Member == null ? "Miembro" : p.Member.FirstName + " " + p.Member.LastName,
                p.Subscription == null || p.Subscription.Plan == null ? null : p.Subscription.Plan.Name,
                p.Amount,
                p.Subscription == null ? (DateOnly?)null : p.Subscription.EndDate))
            .ToListAsync(cancellationToken);

        // Not truncated: the frontend derives analytics (average ticket, revenue by plan and by
        // payment method) and per-category expense totals from these lists, so a Take(n) here
        // would silently skew those numbers.
        var recentPayments = paidPayments
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new FinanceRecentPaymentDto(
                p.Id,
                p.Member == null ? "Miembro" : p.Member.FullName,
                p.Subscription?.Plan?.Name,
                p.Amount,
                p.Currency,
                p.Provider ?? string.Empty,
                p.Status.ToString(),
                p.CreatedAt,
                p.PaidAt))
            .ToList();

        var recentExpenses = expenses
            .OrderByDescending(e => e.ExpenseDate).ThenByDescending(e => e.CreatedAt)
            .Select(e => new ExpenseDto(e.Id, e.Category, e.Description, e.Amount, e.ExpenseDate, e.PaymentMethod, e.Provider, e.CreatedAt))
            .ToList();

        var categoryTotals = expenses
            .GroupBy(e => e.Category)
            .Select(g => new CategoryExpenseTotalDto(
                g.Key,
                g.Where(e => e.ExpenseDate.Year == today.Year && e.ExpenseDate.Month == today.Month).Sum(e => e.Amount),
                g.Where(e => e.ExpenseDate.Year == today.Year).Sum(e => e.Amount)))
            .OrderBy(c => c.Category)
            .ToList();

        return Ok(new FinanceSummaryDto(
            currentMonthRevenue,
            previousMonthRevenue,
            currentMonthExpenses,
            currentMonthPaidPayments,
            monthlyRevenue,
            accountsReceivable,
            recentPayments,
            recentExpenses,
            categoryTotals,
            monthlyHistory));
    }

    [HttpPost("payments")]
    public async Task<ActionResult<FinanceRecentPaymentDto>> RegisterPayment(RegisterPaymentRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
        {
            return BadRequest("El monto del pago debe ser mayor a cero.");
        }

        var member = await _dbContext.Members
            .Include(m => m.Subscriptions).ThenInclude(s => s.Plan)
            .SingleOrDefaultAsync(m => m.Id == request.MemberId && m.IsActive, cancellationToken);

        if (member is null)
        {
            return NotFound("El miembro no existe.");
        }

        var subscription = member.Subscriptions
            .OrderByDescending(s => s.EndDate).ThenByDescending(s => s.CreatedAt)
            .FirstOrDefault();

        if (subscription is null)
        {
            return Conflict("El miembro no tiene una mensualidad para asociar el pago.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var paidAt = request.PaidAt.HasValue
            ? new DateTimeOffset(request.PaidAt.Value.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero)
            : DateTimeOffset.UtcNow;

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantProvider.CurrentTenantId,
            MemberId = member.Id,
            SubscriptionId = subscription.Id,
            Amount = request.Amount,
            Currency = subscription.Plan?.Currency ?? "COP",
            Status = PaymentStatus.Paid,
            Provider = string.IsNullOrWhiteSpace(request.PaymentMethod) ? null : request.PaymentMethod.Trim(),
            PaidAt = paidAt
        };
        _dbContext.Payments.Add(payment);

        // Registering a payment reactivates / renews an expired or suspended membership.
        var durationDays = subscription.Plan?.DurationDays ?? 30;
        if (subscription.Status == SubscriptionStatus.Suspended || subscription.EndDate < today)
        {
            if (subscription.EndDate < today)
            {
                subscription.StartDate = today;
                subscription.EndDate = today.AddDays(durationDays);
            }

            subscription.Status = SubscriptionStatus.Active;
            subscription.ActivatedAt = DateTimeOffset.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new FinanceRecentPaymentDto(
            payment.Id,
            member.FullName,
            subscription.Plan?.Name,
            payment.Amount,
            payment.Currency,
            payment.Provider ?? string.Empty,
            payment.Status.ToString(),
            payment.CreatedAt,
            payment.PaidAt));
    }

    [HttpPost("expenses")]
    public async Task<ActionResult<ExpenseDto>> RegisterExpense(RegisterExpenseRequest request, CancellationToken cancellationToken)
    {
        var category = (request.Category ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(category))
        {
            return BadRequest("La categoria del gasto es obligatoria.");
        }

        if (request.Amount <= 0)
        {
            return BadRequest("El monto del gasto debe ser mayor a cero.");
        }

        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantProvider.CurrentTenantId,
            Category = category,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Amount = request.Amount,
            Currency = "COP",
            ExpenseDate = request.ExpenseDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? null : request.PaymentMethod.Trim(),
            Provider = string.IsNullOrWhiteSpace(request.Provider) ? null : request.Provider.Trim()
        };
        _dbContext.Expenses.Add(expense);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ExpenseDto(expense.Id, expense.Category, expense.Description, expense.Amount, expense.ExpenseDate, expense.PaymentMethod, expense.Provider, expense.CreatedAt));
    }
}
