using GymSaaS.Domain.Enums;

namespace GymSaaS.Domain.Entities;

public sealed class User
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string FullName { get; set; }
    public Role Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Per-account brute-force protection, independent of the IP-based rate limiter in Program.cs.
    // Reset to 0 on a successful login; when it reaches the configured threshold the account is
    // locked until LockoutEndsAt. See AuthController.Login and LockoutOptions.
    public int FailedLoginAttempts { get; set; }
    public DateTimeOffset? LockoutEndsAt { get; set; }

    public Gym? Gym { get; set; }
}
