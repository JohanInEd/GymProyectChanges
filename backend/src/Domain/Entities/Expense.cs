using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class Expense : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Category { get; set; }
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "COP";
    public DateOnly ExpenseDate { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Provider { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
}
