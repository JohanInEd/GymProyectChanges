using GymSaaS.Domain.Common;
using GymSaaS.Domain.Enums;

namespace GymSaaS.Domain.Entities;

public sealed class Payment : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public Guid SubscriptionId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? Provider { get; set; }
    public string? ProviderReference { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? PaidAt { get; set; }

    public Member? Member { get; set; }
    public Subscription? Subscription { get; set; }
}
