using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class Shift : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Employee { get; set; }
    public string? Role { get; set; }
    public DateOnly Date { get; set; }
    public required string StartTime { get; set; }
    public required string EndTime { get; set; }
    public decimal Commission { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
}
