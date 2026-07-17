namespace GymSaaS.Application.DTOs.Members;

public sealed record CreateMemberRequest(
    string FullName,
    string? Email,
    string? Phone,
    string? Gender,
    int? Age,
    string? PlanName,
    decimal? SubscriptionValue,
    DateOnly? StartDate,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? ChestCm,
    decimal? ArmCm,
    decimal? WaistCm,
    decimal? HipCm,
    decimal? LegCm);
