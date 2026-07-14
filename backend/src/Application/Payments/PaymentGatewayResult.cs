namespace GymSaaS.Application.Payments;

public sealed record PaymentGatewayResult(
    bool IsApproved,
    string? ProviderReference,
    string? FailureReason);
