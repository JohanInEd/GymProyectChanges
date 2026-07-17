using GymSaaS.Domain.Common;
using GymSaaS.Domain.Enums;

namespace GymSaaS.Domain.Entities;

/// <summary>
/// A gym's subscription to the SaaS platform — i.e. how the gym pays us. Deliberately
/// distinct from <see cref="Subscription"/>, which is a member's membership at a gym.
/// Kept as rows (not fields on <see cref="Gym"/>) so plan changes and renewals have history.
/// </summary>
public sealed class SaasSubscription : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string PlanType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public SaasSubscriptionStatus Status { get; set; } = SaasSubscriptionStatus.Trial;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
}
