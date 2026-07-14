namespace GymSaaS.Application.DTOs.CheckIns;

public sealed record CheckInResponse(
    Guid AttendanceId,
    Guid MemberId,
    string MemberName,
    bool AccessGranted,
    string Reason,
    DateTimeOffset CheckedInAt,
    DateTimeOffset? CheckedOutAt,
    DateOnly? SubscriptionEndDate);
