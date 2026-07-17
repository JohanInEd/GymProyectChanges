using GymSaaS.Domain.Enums;

namespace GymSaaS.Domain.Entities;

/// <summary>
/// Single-use, expiring token for password reset and email verification. Only the
/// SHA-256 hash of the token is stored; the raw value lives only in the emailed link.
/// Not tenant-scoped (same reasoning as <see cref="User"/>): it is resolved before any
/// tenant context exists.
/// </summary>
public sealed class UserToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string TokenHash { get; set; }
    public UserTokenPurpose Purpose { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
}
