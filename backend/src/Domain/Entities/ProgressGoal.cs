using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class ProgressGoal : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public required string Title { get; set; }
    public decimal? TargetValue { get; set; }
    public string? Unit { get; set; }
    public DateOnly? TargetDate { get; set; }
    public bool Completed { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Member? Member { get; set; }
}
