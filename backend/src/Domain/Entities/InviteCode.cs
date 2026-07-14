namespace GymSaaS.Domain.Entities;

public sealed class InviteCode
{
    public Guid Id { get; set; }
    public required string Code { get; set; }
    public bool IsUsed { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UsedAt { get; set; }
}
