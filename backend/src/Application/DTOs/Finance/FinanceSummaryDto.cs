namespace GymSaaS.Application.DTOs.Finance;

public sealed record FinanceSummaryDto(
    decimal CurrentMonthRevenue,
    decimal PreviousMonthRevenue,
    decimal CurrentMonthExpenses,
    int CurrentMonthPaidPayments,
    IReadOnlyList<MonthlyPointDto> MonthlyRevenue,
    IReadOnlyList<ReceivableDto> AccountsReceivable,
    IReadOnlyList<FinanceRecentPaymentDto> RecentPayments,
    IReadOnlyList<ExpenseDto> RecentExpenses,
    IReadOnlyList<CategoryExpenseTotalDto> CategoryExpenseTotals);
