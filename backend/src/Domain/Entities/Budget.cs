using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

/// <summary>
/// A monthly expense budget per category. The "spent" amount is derived from
/// <see cref="Expense"/> rows, not stored here.
/// </summary>
public sealed class Budget : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Category { get; set; }
    public decimal MonthlyLimit { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
}
