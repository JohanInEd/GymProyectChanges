using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class ProgressRecord : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public DateOnly Date { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? ChestCm { get; set; }
    public decimal? WaistCm { get; set; }
    public decimal? HipCm { get; set; }
    public decimal? BodyFatPercentage { get; set; }
    public string? RecordedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Member? Member { get; set; }
}
