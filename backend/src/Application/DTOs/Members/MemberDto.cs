namespace GymSaaS.Application.DTOs.Members;

public sealed record MemberDto(
    Guid MemberId,
    string FullName,
    string? Email,
    string? Phone,
    string? Gender,
    int? Age,
    Guid? PlanId,
    string? PlanName,
    DateOnly? StartDate,
    DateOnly? EndDate,
    int DaysToExpire,
    string Status,
    string VisualColor,
    string TailwindClass,
    MemberBodyMetricsDto BodyMetrics);
