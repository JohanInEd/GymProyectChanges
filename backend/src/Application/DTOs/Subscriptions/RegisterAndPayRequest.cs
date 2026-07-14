namespace GymSaaS.Application.DTOs.Subscriptions;

public sealed record RegisterAndPayRequest(
    Guid TenantId,
    Guid PlanId,
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string? DocumentNumber,
    string PaymentProvider,
    string PaymentToken);
