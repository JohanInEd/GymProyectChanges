namespace GymSaaS.Application.DTOs.Gym;

public sealed record GymProfileDto(
    string GymName,
    string? City,
    string? Phone,
    string? Email,
    string? SubscriptionPlan,
    string ApprovalStatus,
    DateTimeOffset? TrialEndsAt,
    bool EmailVerified,
    string AdminName,
    string AdminEmail,
    string AdminRole);

public sealed record UpdateGymProfileRequest(
    string? GymName,
    string? City,
    string? Phone,
    string? AdminName);
