namespace GymSaaS.Application.DTOs.Members;

public sealed record UpdateMembershipRequest(DateOnly StartDate, DateOnly EndDate, string? PlanName);
