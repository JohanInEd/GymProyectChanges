namespace GymSaaS.Application.DTOs.CheckIns;

public sealed record CheckInRequest(
    Guid MemberId,
    string? RecordedByUserId);
