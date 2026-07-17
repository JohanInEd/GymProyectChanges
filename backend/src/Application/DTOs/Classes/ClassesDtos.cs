namespace GymSaaS.Application.DTOs.Classes;

public sealed record ClassTemplateDto(
    Guid Id,
    string Name,
    string? Coach,
    int Duration,
    int Capacity,
    string? Room);

public sealed record SaveClassTemplateRequest(
    Guid? Id,
    string Name,
    string? Coach,
    int Duration,
    int Capacity,
    string? Room);

public sealed record ReservationDto(
    Guid Id,
    Guid ClassId,
    Guid MemberId,
    string MemberName,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record GymClassDto(
    Guid Id,
    string Name,
    string? Coach,
    DateOnly Date,
    string Time,
    int Duration,
    int Capacity,
    string? Room,
    IReadOnlyList<ReservationDto> Reservations);

public sealed record CreateClassRequest(
    string Name,
    string? Coach,
    DateOnly Date,
    string Time,
    int Duration,
    int Capacity,
    string? Room,
    Guid? MemberId);

public sealed record CreateReservationRequest(Guid ClassId, Guid MemberId);
