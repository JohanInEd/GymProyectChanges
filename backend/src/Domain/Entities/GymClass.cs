using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

/// <summary>
/// A concrete scheduled class on a specific date and time.
/// </summary>
public sealed class GymClass : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public string? Coach { get; set; }
    public DateOnly Date { get; set; }
    public required string Time { get; set; }
    public int DurationMinutes { get; set; }
    public int Capacity { get; set; }
    public string? Room { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
