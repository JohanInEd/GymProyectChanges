using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// Per-account brute-force protection: too many failed logins on one account lock it temporarily,
/// tracked on the user row so it is independent of the caller's IP. This is a different control from
/// the IP-based rate limiter (AuthenticationBoundaryTests / the "auth" limiter) — here the attacker
/// spreads the guesses across many IPs, which the rate limiter alone would not stop.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class AccountLockoutTests
{
    private readonly ApiFixture _fixture;

    public AccountLockoutTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Too_many_failed_logins_lock_the_account_even_from_different_ips()
    {
        using var gym = await _fixture.RegisterGymAsync("Bloqueo");
        using var client = _fixture.CreateAnonymousClient();

        var threshold = _fixture.Factory.MaxFailedLoginAttempts;

        // Each request omits the test IP header, so the factory assigns a fresh random client IP to
        // every attempt (see GymApiFactory.ClientIpStartupFilter). The IP-based limiter therefore
        // never fires; only the per-account counter accumulates. A lock that still forms proves it
        // is keyed to the account, not the IP.
        for (var attempt = 0; attempt < threshold; attempt++)
        {
            using var failed = await client.PostAsJsonAsync(
                "/api/auth/login",
                new { email = gym.OwnerEmail, password = "definitely-the-wrong-password" },
                Json.Options);

            Assert.Equal(HttpStatusCode.Unauthorized, failed.StatusCode);
        }

        // The account is now locked: even the CORRECT password is refused, with the lockout message.
        using var lockedOut = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = gym.OwnerEmail, password = gym.OwnerPassword },
            Json.Options);

        Assert.Equal(HttpStatusCode.Unauthorized, lockedOut.StatusCode);
        var body = await lockedOut.Content.ReadAsStringAsync();
        Assert.Contains("Demasiados intentos", body, StringComparison.OrdinalIgnoreCase);

        // ...and the lock is persisted on the user row, in the future.
        await using var db = _fixture.Database.CreateInspectionContext();
        var user = await db.Users.SingleAsync(u => u.Email == gym.OwnerEmail);
        Assert.NotNull(user.LockoutEndsAt);
        Assert.True(user.LockoutEndsAt > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task A_successful_login_before_the_threshold_resets_the_counter()
    {
        using var gym = await _fixture.RegisterGymAsync("Reset");
        using var client = _fixture.CreateAnonymousClient();

        var threshold = _fixture.Factory.MaxFailedLoginAttempts;

        // One short of the threshold, then a correct login: the account must not lock, and the
        // failure counter must be back to zero so the next wrong streak starts fresh.
        await FailLoginTimesAsync(client, gym.OwnerEmail, threshold - 1);

        using var ok = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = gym.OwnerEmail, password = gym.OwnerPassword },
            Json.Options);
        await ok.ShouldBeSuccessAsync("logging in with the correct password before the threshold");

        await using (var db = _fixture.Database.CreateInspectionContext())
        {
            var user = await db.Users.SingleAsync(u => u.Email == gym.OwnerEmail);
            Assert.Equal(0, user.FailedLoginAttempts);
            Assert.Null(user.LockoutEndsAt);
        }

        // Because the counter reset, another (threshold - 1) failures still leave the account usable.
        await FailLoginTimesAsync(client, gym.OwnerEmail, threshold - 1);

        using var stillOk = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = gym.OwnerEmail, password = gym.OwnerPassword },
            Json.Options);
        await stillOk.ShouldBeSuccessAsync("logging in again after the counter was reset");
    }

    private static async Task FailLoginTimesAsync(HttpClient client, string email, int times)
    {
        for (var attempt = 0; attempt < times; attempt++)
        {
            using var failed = await client.PostAsJsonAsync(
                "/api/auth/login",
                new { email, password = "definitely-the-wrong-password" },
                Json.Options);

            Assert.Equal(HttpStatusCode.Unauthorized, failed.StatusCode);
        }
    }
}
