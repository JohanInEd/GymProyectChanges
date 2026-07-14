namespace GymSaaS.Application.Payments;

public sealed record PaymentGatewayRequest(
    Guid TenantId,
    Guid MemberId,
    Guid PlanId,
    decimal Amount,
    string Currency,
    string Provider,
    string PaymentToken);
