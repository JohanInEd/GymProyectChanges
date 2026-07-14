namespace GymSaaS.Application.DTOs.CheckIns;

public sealed record AttendanceLogDto(
    Guid AttendanceId,
    Guid MemberId,
    string MemberName,
    string? PlanName,
    bool AccessGranted,
    string Reason,
    DateTimeOffset CheckedInAt,
    DateTimeOffset? CheckedOutAt);
