namespace GymSaaS.Application.DTOs.Dashboard;

public sealed record FinancialSummaryDto(
    decimal CurrentMonthRevenue,
    decimal PreviousMonthRevenue,
    decimal MonthOverMonthDelta,
    int CurrentMonthPaidPayments,
    IReadOnlyList<RecentPaymentDto> RecentPayments);
