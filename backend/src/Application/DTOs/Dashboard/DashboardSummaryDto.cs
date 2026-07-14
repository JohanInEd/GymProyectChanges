namespace GymSaaS.Application.DTOs.Dashboard;

public sealed record DashboardSummaryDto(
    FinancialSummaryDto FinancialSummary,
    IReadOnlyList<MemberSubscriptionDto> Members);
