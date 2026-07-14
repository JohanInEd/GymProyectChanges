namespace GymSaaS.Application.DTOs.Subscriptions;

public sealed record AdminCreateMemberRequest(
    Guid PlanId,
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string? DocumentNumber,
    DateOnly? StartDate);
