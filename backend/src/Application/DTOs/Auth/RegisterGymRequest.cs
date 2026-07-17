namespace GymSaaS.Application.DTOs.Auth;

public sealed record RegisterGymRequest(
    string GymName,
    string City,
    string Phone,
    string OwnerName,
    string Email,
    string Password,
    bool AcceptTerms,
    string InviteCode,
    string? SubscriptionPlan);
