namespace GymSaaS.Domain.Enums;

/// <summary>Status of a gym's subscription to the SaaS itself (not a member's membership).</summary>
public enum SaasSubscriptionStatus
{
    Trial = 0,
    Active = 1,
    PastDue = 2,
    Cancelled = 3
}
