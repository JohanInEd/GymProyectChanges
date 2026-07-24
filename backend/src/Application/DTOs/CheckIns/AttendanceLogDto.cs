namespace GymSaaS.Application.DTOs.CheckIns;

public sealed record AttendanceLogDto(
    Guid AttendanceId,
    Guid MemberId,
    string MemberName,
    string? PlanName,
    bool AccessGranted,
    string Reason,
    DateTimeOffset CheckedInAt,
    DateTimeOffset? CheckedOutAt,
    // Cuando es true, CheckedOutAt es el corte configurado, no una salida observada.
    bool AutoClosed);
