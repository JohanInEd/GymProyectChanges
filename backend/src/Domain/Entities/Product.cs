using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class Product : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Sku { get; set; }
    public required string Name { get; set; }
    public string? Category { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "COP";
    public int Stock { get; set; }
    public int MinimumStock { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
}
