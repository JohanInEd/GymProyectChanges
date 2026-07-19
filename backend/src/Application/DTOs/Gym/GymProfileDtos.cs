namespace GymSaaS.Application.DTOs.Gym;

public sealed record GymProfileDto(
    string GymName,
    string? Country,
    string? City,
    string? Phone,
    string? Email,
    string? SubscriptionPlan,
    string ApprovalStatus,
    DateTimeOffset? TrialEndsAt,
    bool EmailVerified,
    string AdminName,
    string AdminEmail,
    string AdminRole,
    // Lets the UI warn before the user hits a rejected write. "full" or "readOnly".
    string AccessLevel,
    string? AccessReason,
    DateOnly? SubscriptionEndsAt);

public sealed record UpdateGymProfileRequest(
    string? GymName,
    string? Country,
    string? City,
    string? Phone,
    string? AdminName);
