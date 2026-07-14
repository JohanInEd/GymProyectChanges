using GymSaaS.Domain.Common;
using GymSaaS.Domain.Enums;

namespace GymSaaS.Domain.Entities;

public sealed class Subscription : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public Guid PlanId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.PendingPayment;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ActivatedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }

    public Member? Member { get; set; }
    public Plan? Plan { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    public bool IsCurrentlyActive(DateOnly today) =>
        Status == SubscriptionStatus.Active && StartDate <= today && EndDate >= today;
}
