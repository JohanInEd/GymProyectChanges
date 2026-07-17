namespace GymSaaS.Application.DTOs.Finance;

public sealed record ReceivableDto(
    Guid ReceivableId,
    string MemberName,
    string? PlanName,
    decimal Amount,
    DateOnly? DueDate);
