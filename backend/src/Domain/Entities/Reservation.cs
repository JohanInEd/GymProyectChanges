using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class Reservation : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid GymClassId { get; set; }
    public Guid MemberId { get; set; }

    /// <summary>"confirmed" or "cancelled" (matches the frontend vocabulary).</summary>
    public string Status { get; set; } = "confirmed";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public GymClass? GymClass { get; set; }
    public Member? Member { get; set; }
}
