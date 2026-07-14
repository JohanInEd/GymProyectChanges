using GymSaaS.Domain.Enums;

namespace GymSaaS.Application.Services;

public sealed class MembershipStatusService : IMembershipStatusService
{
    public MemberStatus GetStatus(DateOnly endDate, DateOnly today, SubscriptionStatus subscriptionStatus)
    {
        var daysToExpire = GetDaysToExpire(endDate, today);

        if (daysToExpire < 0)
        {
            return MemberStatus.Expired;
        }

        return subscriptionStatus switch
        {
            SubscriptionStatus.Active => daysToExpire <= 5
                ? MemberStatus.ExpiringSoon
                : MemberStatus.Active,
            SubscriptionStatus.Suspended => MemberStatus.Suspended,
            SubscriptionStatus.Cancelled => MemberStatus.Cancelled,
            _ => MemberStatus.Pending
        };
    }

    public int GetDaysToExpire(DateOnly endDate, DateOnly today) =>
        endDate.DayNumber - today.DayNumber;

    public string GetVisualColor(MemberStatus status) =>
        status switch
        {
            MemberStatus.Active => "Green",
            MemberStatus.ExpiringSoon => "Yellow",
            MemberStatus.Expired => "Red",
            _ => "Gray"
        };

    public string GetTailwindClass(MemberStatus status) =>
        status switch
        {
            MemberStatus.Active => "bg-green-100 text-green-800",
            MemberStatus.ExpiringSoon => "bg-yellow-100 text-yellow-800",
            MemberStatus.Expired => "bg-red-100 text-red-800",
            _ => "bg-gray-100 text-gray-800"
        };
}
