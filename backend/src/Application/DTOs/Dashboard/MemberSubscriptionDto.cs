namespace GymSaaS.Application.DTOs.Dashboard;

public sealed record MemberSubscriptionDto(
    Guid MemberId,
    string FullName,
    string Email,
    string PlanName,
    DateOnly StartDate,
    DateOnly EndDate,
    int DaysToExpire,
    string Status,
    string VisualColor,
    string TailwindClass);
