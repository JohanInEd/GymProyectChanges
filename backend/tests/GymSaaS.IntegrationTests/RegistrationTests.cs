using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// The gate in front of tenant creation: who is allowed to become a gym, and what a new gym gets.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class RegistrationTests
{
    private readonly ApiFixture _fixture;

    public RegistrationTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task An_invite_code_works_exactly_once()
    {
        var code = $"ONCE{Guid.NewGuid():N}"[..16].ToUpperInvariant();
        await _fixture.SeedInviteCodeAsync(code);

        using var client = _fixture.CreateAnonymousClient();

        using var first = await client.PostAsJsonAsync("/api/auth/register-gym", RegistrationBody(code), Json.Options);
        await first.ShouldBeSuccessAsync("the first registration with a fresh code");

        using var second = await client.PostAsJsonAsync("/api/auth/register-gym", RegistrationBody(code), Json.Options);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);

        await using var dbContext = _fixture.Database.CreateInspectionContext();
        var inviteCode = await dbContext.InviteCodes.SingleAsync(c => c.Code == code);
        Assert.True(inviteCode.IsUsed);
        Assert.NotNull(inviteCode.UsedAt);
    }

    [Fact]
    public async Task Registration_without_a_valid_invite_code_creates_nothing()
    {
        using var client = _fixture.CreateAnonymousClient();
        var body = RegistrationBody("CODIGO-QUE-NO-EXISTE");

        using var response = await client.PostAsJsonAsync("/api/auth/register-gym", body, Json.Options);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var email = (string)body.GetType().GetProperty("email")!.GetValue(body)!;
        await using var dbContext = _fixture.Database.CreateInspectionContext();
        Assert.False(await dbContext.Users.AnyAsync(u => u.Email == email));
    }

    [Fact]
    public async Task The_country_is_required_and_stored()
    {
        var code = $"PAIS{Guid.NewGuid():N}"[..16].ToUpperInvariant();
        await _fixture.SeedInviteCodeAsync(code);

        using var client = _fixture.CreateAnonymousClient();

        // Sin pais no se puede registrar: el formulario lo pide y el backend debe exigirlo igual,
        // porque el navegador no es un control de validacion.
        var sinPais = RegistrationBody(code);
        var payload = sinPais.GetType().GetProperties().ToDictionary(p => p.Name, p => p.GetValue(sinPais));
        payload["country"] = "";

        using var rechazado = await client.PostAsJsonAsync("/api/auth/register-gym", payload, Json.Options);
        Assert.Equal(HttpStatusCode.BadRequest, rechazado.StatusCode);

        // El codigo no se quema en el intento fallido.
        await using (var dbContext = _fixture.Database.CreateInspectionContext())
        {
            Assert.False((await dbContext.InviteCodes.SingleAsync(c => c.Code == code)).IsUsed);
        }

        using var gym = await _fixture.RegisterGymAsync("ConPais");
        var perfil = await gym.GetAsync("/api/gym");
        Assert.Equal("Colombia", perfil.GetProperty("country").GetString());

        await using var db = _fixture.Database.CreateInspectionContext();
        Assert.Equal("Colombia", (await db.Gyms.SingleAsync(g => g.Id == gym.TenantId)).Country);
    }

    [Fact]
    public async Task A_new_gym_gets_its_own_trial_subscription_with_the_plan_it_chose()
    {
        using var gym = await _fixture.RegisterGymAsync("Alfa");

        var billing = await gym.GetAsync("/api/billing");
        var subscription = billing.GetProperty("subscription");

        Assert.Equal("starter", subscription.GetProperty("planType").GetString());
        Assert.Equal("Trial", subscription.GetProperty("status").GetString());

        var startDate = subscription.GetProperty("startDate").GetDateTime();
        var endDate = subscription.GetProperty("endDate").GetDateTime();
        Assert.Equal(14, (endDate - startDate).Days);

        await using var dbContext = _fixture.Database.CreateInspectionContext();
        var stored = await dbContext.Gyms.SingleAsync(g => g.Id == gym.TenantId);
        Assert.Equal("starter", stored.SubscriptionPlan);
        Assert.False(stored.EmailVerified);
    }

    [Fact]
    public async Task An_email_can_only_belong_to_one_gym()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");

        // A second gym registering with Alfa's owner email would make login ambiguous:
        // the tenant is resolved from the email, so it has to stay globally unique.
        var code = $"DUP{Guid.NewGuid():N}"[..16].ToUpperInvariant();
        await _fixture.SeedInviteCodeAsync(code);

        using var client = _fixture.CreateAnonymousClient();
        using var response = await client.PostAsJsonAsync(
            "/api/auth/register-gym",
            RegistrationBody(code, alfa.OwnerEmail),
            Json.Options);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        // The code was not burned by the rejected attempt.
        await using var dbContext = _fixture.Database.CreateInspectionContext();
        var inviteCode = await dbContext.InviteCodes.SingleAsync(c => c.Code == code);
        Assert.False(inviteCode.IsUsed);
    }

    [Fact]
    public async Task Staff_emails_are_unique_across_gyms_too()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        var sharedEmail = $"{Guid.NewGuid():N}@staff.test";

        await alfa.PostAsync("/api/staff", new
        {
            name = "Recepcion Alfa",
            email = sharedEmail,
            role = "reception",
            password = "StaffPassword123!"
        });

        using var response = await beta.TryPostAsync("/api/staff", new
        {
            name = "Recepcion Beta",
            email = sharedEmail,
            role = "reception",
            password = "StaffPassword123!"
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task The_owner_can_log_in_and_the_session_resolves_to_their_gym()
    {
        using var gym = await _fixture.RegisterGymAsync("Alfa");
        var memberId = await gym.CreateMemberAsync("Ana Alfa");

        using var client = _fixture.CreateAnonymousClient();
        using var login = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = gym.OwnerEmail, password = gym.OwnerPassword },
            Json.Options);

        await login.ShouldBeSuccessAsync("logging in as the owner");
        var payload = await login.ReadJsonAsync();

        Assert.Equal(gym.TenantId, payload.GetProperty("user").GetGuid("tenantId"));

        // A fresh login must land on the same data as the registration session.
        using var reopened = _fixture.CreateAnonymousClient();
        reopened.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", payload.GetProperty("token").GetString());

        using var membersResponse = await reopened.GetAsync("/api/members");
        await membersResponse.ShouldBeSuccessAsync("reading members after re-login");
        var members = await membersResponse.ReadJsonAsync();
        Assert.Contains(memberId, members.MemberIds());
    }

    private static object RegistrationBody(string inviteCode, string? email = null)
    {
        var unique = Guid.NewGuid().ToString("N")[..12];
        return new
        {
            gymName = $"Gimnasio {unique}",
            country = "Colombia",
            city = "Medellin",
            phone = "3001112233",
            ownerName = "Propietario Prueba",
            email = email ?? $"owner-{unique}@integration.test",
            password = "IntegrationTest123!",
            acceptTerms = true,
            inviteCode,
            subscriptionPlan = "starter"
        };
    }
}
