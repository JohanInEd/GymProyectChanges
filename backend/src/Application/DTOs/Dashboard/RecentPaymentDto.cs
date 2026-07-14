namespace GymSaaS.Application.DTOs.Dashboard;

public sealed record RecentPaymentDto(
    Guid PaymentId,
    string MemberName,
    string PlanName,
    decimal Amount,
    string Currency,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? PaidAt);
