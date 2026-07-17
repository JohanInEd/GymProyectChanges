using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class ProgressNote : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public required string Text { get; set; }
    public string? Author { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Member? Member { get; set; }
}
