using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

/// <summary>
/// Reusable class definition (the catalog registered in Configuracion), used to
/// pre-fill scheduled classes. Distinct from <see cref="GymClass"/>, which is a
/// concrete class on a specific date/time.
/// </summary>
public sealed class ClassTemplate : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public string? Coach { get; set; }
    public int DurationMinutes { get; set; }
    public int Capacity { get; set; }
    public string? Room { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
}
