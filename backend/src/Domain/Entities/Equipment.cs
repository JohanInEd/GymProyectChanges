using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class Equipment : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public string? Category { get; set; }

    /// <summary>"Operativo", "Mantenimiento", etc. (matches the frontend vocabulary).</summary>
    public string Status { get; set; } = "Operativo";
    public DateOnly? NextMaintenance { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
}
