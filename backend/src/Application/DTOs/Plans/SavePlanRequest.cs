namespace GymSaaS.Application.DTOs.Plans;

public sealed record SavePlanRequest(
    Guid? Id,
    string Name,
    string? Description,
    decimal Price,
    int DurationDays,
    int? MaxClasses);
