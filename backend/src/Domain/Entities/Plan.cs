using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class Plan : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "USD";
    public int DurationDays { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
