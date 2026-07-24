namespace GymSaaS.Infrastructure.Auth;

/// <summary>
/// Bound to the "AccountLockout" configuration section. Temporarily locks a single account after too
/// many failed logins, tracked on the user row so it is independent of the caller's IP. This
/// complements the IP-based fixed-window rate limiter in Program.cs: the rate limiter throttles a
/// noisy client, this stops a distributed guess against one specific account and does not punish
/// everyone sharing one office IP.
///
/// Named AccountLockoutOptions (not LockoutOptions) to avoid colliding with
/// Microsoft.AspNetCore.Identity.LockoutOptions, which is in scope wherever the password hasher is.
/// </summary>
public sealed class AccountLockoutOptions
{
    /// <summary>Consecutive failed attempts on one account before it is locked.</summary>
    public int MaxFailedAttempts { get; set; } = 5;

    /// <summary>How long the account stays locked once the threshold is hit.</summary>
    public int LockoutMinutes { get; set; } = 15;

    /// <summary>
    /// Master switch. Set to false to disable account lockout without a deploy — useful if it ever
    /// misfires and starts locking real customers out (same escape-hatch pattern as Billing).
    /// </summary>
    public bool Enabled { get; set; } = true;
}
