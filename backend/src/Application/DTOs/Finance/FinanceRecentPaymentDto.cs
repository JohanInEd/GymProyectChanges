namespace GymSaaS.Application.DTOs.Finance;

public sealed record FinanceRecentPaymentDto(
    Guid Id,
    string MemberName,
    string? PlanName,
    decimal Amount,
    string Currency,
    string Method,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? PaidAt);
