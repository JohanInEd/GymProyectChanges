namespace GymSaaS.Application.DTOs.CheckIns;

public sealed record CheckOutRequest(
    Guid MemberId,
    string? RecordedByUserId);
