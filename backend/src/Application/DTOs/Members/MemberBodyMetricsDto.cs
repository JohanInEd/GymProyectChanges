namespace GymSaaS.Application.DTOs.Members;

public sealed record MemberBodyMetricsDto(
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? ChestCm,
    decimal? ArmCm,
    decimal? WaistCm,
    decimal? HipCm,
    decimal? LegCm);
