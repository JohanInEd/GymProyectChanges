using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class Attendance : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public DateTimeOffset CheckedInAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CheckedOutAt { get; set; }
    public bool AccessGranted { get; set; }
    public required string Reason { get; set; }
    public string? RecordedByUserId { get; set; }
    public string? CheckedOutByUserId { get; set; }

    public Gym? Gym { get; set; }
    public Member? Member { get; set; }
    public Subscription? Subscription { get; set; }
}
