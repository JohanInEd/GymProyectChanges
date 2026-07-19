using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// Isolation is only as strong as the token it is derived from. These tests attack the tenant claim
/// itself: forge it, re-sign it, or try to override it from outside the token.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class AuthenticationBoundaryTests
{
    private const string TenantIdClaimType = "tenant_id";

    private static readonly string[] ProtectedEndpoints =
    {
        "/api/members",
        "/api/plans",
        "/api/products",
        "/api/classes",
        "/api/progress",
        "/api/operations",
        "/api/staff",
        "/api/gym",
        "/api/billing",
        "/api/finance/summary",
        "/api/check-ins/recent"
    };

    private readonly ApiFixture _fixture;

    public AuthenticationBoundaryTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Every_business_endpoint_requires_a_token()
    {
        using var client = _fixture.CreateAnonymousClient();

        foreach (var endpoint in ProtectedEndpoints)
        {
            using var response = await client.GetAsync(endpoint);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }

    [Fact]
    public async Task A_token_signed_with_the_wrong_key_is_rejected()
    {
        using var victim = await _fixture.RegisterGymAsync("Victima");

        // Correct claims, correct issuer and audience — only the signature is wrong.
        var forged = CreateToken(
            tenantId: victim.TenantId,
            userId: victim.OwnerUserId,
            signingKey: "a-completely-different-key-that-is-long-enough-0123456789");


        using var client = _fixture.CreateAnonymousClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", forged);

        using var response = await client.GetAsync("/api/members");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Editing_the_tenant_claim_invalidates_the_token()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");
        await alfa.CreateMemberAsync("Ana Alfa");

        // Beta rewrites its own valid token to claim Alfa's tenant. Without the signing key the
        // result cannot be re-signed, so it must fail validation rather than impersonate Alfa.
        var tampered = TamperTenantClaim(beta.Token, alfa.TenantId);

        using var client = _fixture.CreateAnonymousClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tampered);

        using var response = await client.GetAsync("/api/members");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task The_tenant_cannot_be_chosen_with_a_header()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        var alfaMemberId = await alfa.CreateMemberAsync("Ana Alfa");

        // Regression guard for the removed HeaderTenantProvider: the tenant used to come from a
        // client-supplied X-Tenant-Id header, so any logged-in user could read any gym by changing it.
        beta.Client.DefaultRequestHeaders.Add("X-Tenant-Id", alfa.TenantId.ToString());

        var members = await beta.GetAsync("/api/members");
        Assert.DoesNotContain(alfaMemberId, members.MemberIds());
        Assert.Empty(members.EnumerateArray());
    }

    [Fact]
    public async Task A_token_without_a_tenant_claim_returns_no_data()
    {
        using var victim = await _fixture.RegisterGymAsync("Victima");
        await victim.CreateMemberAsync("Ana Victima");

        var withoutTenant = CreateToken(
            tenantId: null,
            userId: victim.OwnerUserId,
            signingKey: _fixture.Factory.SigningKey);

        using var client = _fixture.CreateAnonymousClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", withoutTenant);

        using var response = await client.GetAsync("/api/members");

        // Currently a 500: ClaimsTenantProvider throws rather than resolving a tenant. That is the
        // safe direction (it fails closed and returns nothing), so this asserts the security
        // property, not the exact status — turning it into a 401 later should not fail this test.
        Assert.False(response.IsSuccessStatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Ana Victima", body);
    }

    [Fact]
    public async Task An_expired_token_is_rejected()
    {
        using var victim = await _fixture.RegisterGymAsync("Victima");

        var expired = CreateToken(
            tenantId: victim.TenantId,
            userId: victim.OwnerUserId,
            signingKey: _fixture.Factory.SigningKey,
            expires: DateTime.UtcNow.AddHours(-2));

        using var client = _fixture.CreateAnonymousClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expired);

        using var response = await client.GetAsync("/api/members");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_deactivated_staff_account_cannot_log_in()
    {
        using var gym = await _fixture.RegisterGymAsync("Alfa");

        var staff = await gym.PostAsync("/api/staff", new
        {
            name = "Recepcion Alfa",
            email = $"{Guid.NewGuid():N}@staff.test",
            role = "reception",
            password = "StaffPassword123!"
        });

        var staffId = staff.GetGuid("id");
        var staffEmail = staff.GetProperty("email").GetString()!;

        await gym.PostAsync($"/api/staff/{staffId}/toggle", new { });

        using var client = _fixture.CreateAnonymousClient();
        using var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = staffEmail, password = "StaffPassword123!" },
            Json.Options);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private string CreateToken(Guid? tenantId, Guid userId, string signingKey, DateTime? expires = null)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "Owner"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (tenantId is Guid tenant)
        {
            claims.Add(new Claim(TenantIdClaimType, tenant.ToString()));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _fixture.Factory.Issuer,
            audience: _fixture.Factory.Audience,
            claims: claims,
            expires: expires ?? DateTime.UtcNow.AddMinutes(30),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>Rewrites the tenant claim in the payload while keeping the original signature.</summary>
    private static string TamperTenantClaim(string token, Guid newTenantId)
    {
        var parts = token.Split('.');
        var payload = Encoding.UTF8.GetString(Base64UrlDecode(parts[1]));

        var original = payload[(payload.IndexOf($"\"{TenantIdClaimType}\"", StringComparison.Ordinal))..];
        var originalTenant = original.Split('"')[3];
        var rewritten = payload.Replace(originalTenant, newTenantId.ToString());

        parts[1] = Base64UrlEncode(Encoding.UTF8.GetBytes(rewritten));
        return string.Join('.', parts);
    }

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + ((4 - (padded.Length % 4)) % 4), '=');
        return Convert.FromBase64String(padded);
    }

    private static string Base64UrlEncode(byte[] value) =>
        Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
