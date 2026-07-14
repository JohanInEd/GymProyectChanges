using GymSaaS.Domain.Enums;

namespace GymSaaS.Application.DTOs.Subscriptions;

public sealed record RegisterAndPayResponse(
    Guid MemberId,
    Guid SubscriptionId,
    Guid PaymentId,
    SubscriptionStatus SubscriptionStatus,
    PaymentStatus PaymentStatus,
    DateOnly StartDate,
    DateOnly EndDate);
