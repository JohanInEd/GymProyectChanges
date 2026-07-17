namespace GymSaaS.Application.DTOs.Finance;

public sealed record ExpenseDto(
    Guid Id,
    string Category,
    string? Description,
    decimal Amount,
    DateOnly ExpenseDate,
    string? PaymentMethod,
    string? Provider,
    DateTimeOffset CreatedAt);
