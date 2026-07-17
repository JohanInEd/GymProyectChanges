namespace GymSaaS.Application.DTOs.Finance;

public sealed record RegisterPaymentRequest(
    Guid MemberId,
    decimal Amount,
    string? PaymentMethod,
    DateOnly? PaidAt);
