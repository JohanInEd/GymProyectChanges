namespace GymSaaS.Application.DTOs.CheckIns;

public sealed record CheckOutResponse(
    Guid AttendanceId,
    Guid MemberId,
    DateTimeOffset CheckedInAt,
    DateTimeOffset CheckedOutAt);
