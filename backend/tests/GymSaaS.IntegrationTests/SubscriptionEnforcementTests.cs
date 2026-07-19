using System.Net;
using System.Net.Http.Json;
using GymSaaS.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// A gym whose trial or subscription ran out drops to read-only: it keeps full access to its own
/// data (and its invoice) but cannot write. Getting this wrong is expensive in both directions —
/// too lax and gyms use the product free forever, too strict and a paying customer is locked out of
/// their own gym on a Sunday.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class SubscriptionEnforcementTests
{
    private readonly ApiFixture _fixture;

    public SubscriptionEnforcementTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task A_gym_inside_its_trial_can_write_normally()
    {
        using var gym = await _fixture.RegisterGymAsync("Vigente");

        var memberId = await gym.CreateMemberAsync("Cliente Dentro de Prueba");
        Assert.NotEqual(Guid.Empty, memberId);
    }

    [Fact]
    public async Task An_expired_gym_cannot_write()
    {
        using var gym = await _fixture.RegisterGymAsync("Vencido");
        await ExpireSubscriptionAsync(gym.TenantId, daysPastEnd: 10);

        using var response = await gym.TryPostAsync("/api/members", new
        {
            fullName = "Cliente Rechazado",
            planName = "Mensual",
            subscriptionValue = 90_000m
        });

        Assert.Equal(HttpStatusCode.PaymentRequired, response.StatusCode);

        var message = await response.Content.ReadAsStringAsync();
        Assert.Contains("prueba", message, StringComparison.OrdinalIgnoreCase);

        // And nothing was written.
        await using var dbContext = _fixture.Database.CreateInspectionContext();
        Assert.False(await dbContext.Members
            .IgnoreQueryFilters()
            .AnyAsync(m => m.TenantId == gym.TenantId && m.FirstName == "Cliente"));
    }

    [Fact]
    public async Task An_expired_gym_can_still_read_everything_it_owns()
    {
        using var gym = await _fixture.RegisterGymAsync("VencidoLectura");

        // Create data while still inside the trial, then expire.
        var memberId = await gym.CreateMemberAsync("Cliente Historico");
        await ExpireSubscriptionAsync(gym.TenantId, daysPastEnd: 30);

        // Every read still works — the gym's records are not held hostage.
        Assert.Contains(memberId, (await gym.GetAsync("/api/members")).MemberIds());
        Assert.NotEmpty((await gym.GetAsync("/api/plans")).EnumerateArray());
        await gym.GetAsync("/api/finance/summary");
        await gym.GetAsync("/api/operations");
        await gym.GetAsync("/api/progress");
        await gym.GetAsync("/api/products");
    }

    [Fact]
    public async Task An_expired_gym_can_still_log_in_and_see_what_it_owes()
    {
        using var gym = await _fixture.RegisterGymAsync("VencidoFactura");
        await ExpireSubscriptionAsync(gym.TenantId, daysPastEnd: 5);

        // Locking these would leave a customer with no way to pay and no way back in.
        var billing = await gym.GetAsync("/api/billing");
        Assert.NotEqual(Guid.Empty, billing.GetProperty("subscription").GetGuid("id"));

        var profile = await gym.GetAsync("/api/gym");
        Assert.Equal("readOnly", profile.GetProperty("accessLevel").GetString());
        Assert.False(string.IsNullOrWhiteSpace(profile.GetProperty("accessReason").GetString()));

        using var client = _fixture.CreateAnonymousClient();
        using var login = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = gym.OwnerEmail, password = gym.OwnerPassword },
            Json.Options);

        await login.ShouldBeSuccessAsync("logging in with an expired subscription");
    }

    [Fact]
    public async Task The_grace_period_keeps_a_just_expired_gym_working()
    {
        using var gym = await _fixture.RegisterGymAsync("EnGracia");

        // Ended yesterday; the configured grace is 1 day, so writes must still go through.
        await ExpireSubscriptionAsync(gym.TenantId, daysPastEnd: 1);

        var memberId = await gym.CreateMemberAsync("Cliente En Gracia");
        Assert.NotEqual(Guid.Empty, memberId);

        var profile = await gym.GetAsync("/api/gym");
        Assert.Equal("full", profile.GetProperty("accessLevel").GetString());
    }

    [Fact]
    public async Task A_cancelled_subscription_is_read_only_even_before_its_end_date()
    {
        using var gym = await _fixture.RegisterGymAsync("Cancelado");
        await SetStatusAsync(gym.TenantId, SaasSubscriptionStatus.Cancelled);

        using var response = await gym.TryPostAsync("/api/finance/expenses", new
        {
            category = "Servicios",
            amount = 10_000m
        });

        Assert.Equal(HttpStatusCode.PaymentRequired, response.StatusCode);
        Assert.Contains("cancelada", await response.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Enforcement_never_leaks_across_gyms()
    {
        using var expired = await _fixture.RegisterGymAsync("VencidoA");
        using var current = await _fixture.RegisterGymAsync("VigenteB");

        await ExpireSubscriptionAsync(expired.TenantId, daysPastEnd: 20);

        // One gym's expiry must not affect the other's.
        var memberId = await current.CreateMemberAsync("Cliente Del Vigente");
        Assert.NotEqual(Guid.Empty, memberId);

        using var blocked = await expired.TryPostAsync("/api/members", new { fullName = "Nadie" });
        Assert.Equal(HttpStatusCode.PaymentRequired, blocked.StatusCode);
    }

    private async Task ExpireSubscriptionAsync(Guid tenantId, int daysPastEnd)
    {
        await using var dbContext = _fixture.Database.CreateInspectionContext();
        var subscription = await dbContext.SaasSubscriptions
            .IgnoreQueryFilters()
            .SingleAsync(s => s.TenantId == tenantId);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        subscription.EndDate = today.AddDays(-daysPastEnd);
        subscription.StartDate = subscription.EndDate.AddDays(-14);
        await dbContext.SaveChangesAsync();
    }

    private async Task SetStatusAsync(Guid tenantId, SaasSubscriptionStatus status)
    {
        await using var dbContext = _fixture.Database.CreateInspectionContext();
        var subscription = await dbContext.SaasSubscriptions
            .IgnoreQueryFilters()
            .SingleAsync(s => s.TenantId == tenantId);

        subscription.Status = status;
        await dbContext.SaveChangesAsync();
    }
}
