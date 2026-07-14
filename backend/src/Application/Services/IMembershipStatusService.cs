using GymSaaS.Domain.Enums;

namespace GymSaaS.Application.Services;

public interface IMembershipStatusService
{
    MemberStatus GetStatus(DateOnly endDate, DateOnly today, SubscriptionStatus subscriptionStatus);
    int GetDaysToExpire(DateOnly endDate, DateOnly today);
    string GetVisualColor(MemberStatus status);
    string GetTailwindClass(MemberStatus status);
}
