using System.Net.Http.Headers;
using System.Net.Http.Json;
using GymSaaS.Domain.Entities;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// One migrated throwaway database and one running application, shared by the whole test run.
/// Tests stay independent of each other by registering their own gyms with unique identifiers
/// rather than by resetting the database between tests.
/// </summary>
public sealed class ApiFixture : IAsyncLifetime
{
    private TestDatabase _database = null!;

    public GymApiFactory Factory { get; private set; } = null!;

    public TestDatabase Database => _database;

    public async Task InitializeAsync()
    {
        _database = await TestDatabase.CreateAsync();
        Factory = new GymApiFactory(_database.ConnectionString);

        // Forces the host to build, which runs Database.Migrate() in Program.cs.
        // If a migration is broken, every test fails here with the real error.
        using var probe = Factory.CreateClient();
        _ = probe;
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _database.DisposeAsync();
    }

    /// <summary>Registers a brand-new gym through the real public endpoint and returns its session.</summary>
    public async Task<GymSession> RegisterGymAsync(string label)
    {
        var unique = Guid.NewGuid().ToString("N")[..12];
        var code = $"IT{unique}".ToUpperInvariant();
        await SeedInviteCodeAsync(code);

        var email = $"{label.ToLowerInvariant()}-{unique}@integration.test";
        var password = "IntegrationTest123!";

        using var client = Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register-gym", new
        {
            gymName = $"Gimnasio {label} {unique}",
            country = "Colombia",
            city = "Bogota",
            phone = "3000000000",
            ownerName = $"Owner {label}",
            email,
            password,
            acceptTerms = true,
            inviteCode = code,
            subscriptionPlan = "starter"
        }, Json.Options);

        await response.ShouldBeSuccessAsync($"registering gym '{label}'");

        var payload = await response.Content.ReadFromJsonAsync<AuthPayload>(Json.Options)
            ?? throw new InvalidOperationException("register-gym returned an empty body.");

        return new GymSession(this, label, payload.Token, payload.User.TenantId, payload.User.Id, email, password);
    }

    public async Task SeedInviteCodeAsync(string code)
    {
        await using var dbContext = _database.CreateInspectionContext();
        dbContext.InviteCodes.Add(new InviteCode { Id = Guid.NewGuid(), Code = code.ToUpperInvariant() });
        await dbContext.SaveChangesAsync();
    }

    /// <summary>An HTTP client with no credentials at all.</summary>
    public HttpClient CreateAnonymousClient() => Factory.CreateClient();

    internal HttpClient CreateAuthenticatedClient(string token)
    {
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private sealed record AuthPayload(string Token, AuthUserPayload User);

    private sealed record AuthUserPayload(Guid Id, Guid TenantId, string Name, string Email, string Role);
}

[CollectionDefinition(ApiCollection.Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFixture>
{
    public const string Name = "gym-api";
}
