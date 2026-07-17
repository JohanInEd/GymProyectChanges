namespace GymSaaS.Application.DTOs.Finance;

public sealed record RegisterExpenseRequest(
    string Category,
    string? Description,
    decimal Amount,
    DateOnly? ExpenseDate,
    string? PaymentMethod,
    string? Provider);
