namespace GymSaaS.Application.DTOs.Plans;

public sealed record PlanDto(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    string Currency,
    int DurationDays,
    int? MaxClasses,
    bool IsActive);
