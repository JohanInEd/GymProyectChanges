namespace GymSaaS.Application.DTOs.Members;

public sealed record UpdateMemberRequest(
    string? FullName,
    string? Email,
    string? Phone,
    string? Gender,
    int? Age,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? ChestCm,
    decimal? ArmCm,
    decimal? WaistCm,
    decimal? HipCm,
    decimal? LegCm);
