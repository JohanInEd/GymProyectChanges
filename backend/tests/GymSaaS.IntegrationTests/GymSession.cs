using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// A logged-in gym: its JWT, its tenant id, and an HTTP client that carries the token.
/// Every call a test makes goes through the real HTTP pipeline, so the tenant always comes from
/// the signed token exactly as it does for the frontend.
/// </summary>
public sealed class GymSession : IDisposable
{
    private readonly ApiFixture _fixture;

    internal GymSession(
        ApiFixture fixture,
        string label,
        string token,
        Guid tenantId,
        Guid ownerUserId,
        string ownerEmail,
        string ownerPassword)
    {
        _fixture = fixture;
        Label = label;
        Token = token;
        TenantId = tenantId;
        OwnerUserId = ownerUserId;
        OwnerEmail = ownerEmail;
        OwnerPassword = ownerPassword;
        Client = fixture.CreateAuthenticatedClient(token);
    }

    public string Label { get; }

    public string Token { get; }

    public Guid TenantId { get; }

    public Guid OwnerUserId { get; }

    public string OwnerEmail { get; }

    public string OwnerPassword { get; }

    public HttpClient Client { get; }

    // ---- calls that are expected to succeed -------------------------------------------------

    public async Task<JsonElement> GetAsync(string url)
    {
        var response = await Client.GetAsync(url);
        await response.ShouldBeSuccessAsync($"{Label} GET {url}");
        return await response.ReadJsonAsync();
    }

    public async Task<JsonElement> PostAsync(string url, object body)
    {
        var response = await Client.PostAsJsonAsync(url, body, Json.Options);
        await response.ShouldBeSuccessAsync($"{Label} POST {url}");
        return await response.ReadJsonAsync();
    }

    public async Task<JsonElement> PutAsync(string url, object body)
    {
        var response = await Client.PutAsJsonAsync(url, body, Json.Options);
        await response.ShouldBeSuccessAsync($"{Label} PUT {url}");
        return await response.ReadJsonAsync();
    }

    // ---- calls a test expects to be rejected ------------------------------------------------

    public Task<HttpResponseMessage> TryGetAsync(string url) => Client.GetAsync(url);

    public Task<HttpResponseMessage> TryPostAsync(string url, object body) =>
        Client.PostAsJsonAsync(url, body, Json.Options);

    public Task<HttpResponseMessage> TryPutAsync(string url, object body) =>
        Client.PutAsJsonAsync(url, body, Json.Options);

    public Task<HttpResponseMessage> TryDeleteAsync(string url) => Client.DeleteAsync(url);

    // ---- domain helpers ---------------------------------------------------------------------

    /// <summary>Creates a member with an active membership, and returns its id.</summary>
    public async Task<Guid> CreateMemberAsync(string name, string planName = "Mensual", decimal price = 100_000m)
    {
        var member = await PostAsync("/api/members", new
        {
            fullName = name,
            email = $"{Guid.NewGuid():N}@members.test",
            phone = "3001234567",
            gender = "F",
            age = 30,
            planName,
            subscriptionValue = price,
            startDate = DateOnly.FromDateTime(DateTime.UtcNow)
        });

        return member.GetGuid("memberId");
    }

    public async Task<Guid> CreatePlanAsync(string name, decimal price = 80_000m, int durationDays = 30)
    {
        var plan = await PostAsync("/api/plans", new
        {
            name,
            description = $"Plan {name}",
            price,
            durationDays,
            maxClasses = 8
        });

        return plan.GetGuid("id");
    }

    public async Task<Guid> CreateProductAsync(string sku, string name, int stock = 10)
    {
        var product = await PostAsync("/api/products", new
        {
            sku,
            name,
            category = "Suplementos",
            price = 50_000m,
            stock,
            minimumStock = 2
        });

        return product.GetGuid("id");
    }

    public async Task<Guid> CreateEquipmentAsync(string name)
    {
        var equipment = await PostAsync("/api/operations/equipment", new
        {
            name,
            category = "Cardio",
            status = "Operativo",
            nextMaintenance = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30))
        });

        return equipment.GetGuid("id");
    }

    public async Task<Guid> CreateShiftAsync(string employee)
    {
        var shift = await PostAsync("/api/operations/shifts", new
        {
            employee,
            role = "Recepcion",
            date = DateOnly.FromDateTime(DateTime.UtcNow),
            startTime = "08:00",
            endTime = "16:00",
            commission = 25_000m
        });

        return shift.GetGuid("id");
    }

    public async Task<Guid> CreateClassTemplateAsync(string name)
    {
        var template = await PostAsync("/api/classes/templates", new
        {
            name,
            coach = "Entrenador",
            duration = 60,
            capacity = 12,
            room = "Salon 1"
        });

        return template.GetGuid("id");
    }

    public async Task<Guid> CreateClassAsync(string name)
    {
        var gymClass = await PostAsync("/api/classes", new
        {
            name,
            coach = "Entrenador",
            date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            time = "18:00",
            duration = 60,
            capacity = 12,
            room = "Salon 1"
        });

        return gymClass.GetGuid("id");
    }

    public async Task<Guid> CreateStaffAsync(string role = "reception")
    {
        var staff = await PostAsync("/api/staff", new
        {
            name = $"Staff {Label}",
            email = $"{Guid.NewGuid():N}@staff.test",
            role,
            password = "StaffPassword123!"
        });

        return staff.GetGuid("id");
    }

    public async Task RegisterPaymentAsync(Guid memberId, decimal amount)
    {
        await PostAsync("/api/finance/payments", new
        {
            memberId,
            amount,
            paymentMethod = "Efectivo",
            paidAt = DateOnly.FromDateTime(DateTime.UtcNow)
        });
    }

    public async Task RegisterExpenseAsync(string category, decimal amount)
    {
        await PostAsync("/api/finance/expenses", new
        {
            category,
            description = "Gasto de prueba",
            amount,
            expenseDate = DateOnly.FromDateTime(DateTime.UtcNow),
            paymentMethod = "Transferencia",
            provider = "Proveedor"
        });
    }

    public void Dispose() => Client.Dispose();
}

internal static class Json
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);
}

internal static class HttpAssertions
{
    /// <summary>Fails with the server's own message instead of a bare status-code mismatch.</summary>
    public static async Task ShouldBeSuccessAsync(this HttpResponseMessage response, string what)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync();
        Assert.Fail($"Expected {what} to succeed but got {(int)response.StatusCode} {response.StatusCode}. Body: {body}");
    }

    public static async Task<JsonElement> ReadJsonAsync(this HttpResponseMessage response)
    {
        var raw = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(raw) ? "null" : raw);
        return document.RootElement.Clone();
    }

    public static Guid GetGuid(this JsonElement element, string property)
    {
        if (!element.TryGetProperty(property, out var value))
        {
            throw new InvalidOperationException(
                $"Expected a '{property}' property in the response but got: {element}");
        }

        return value.GetGuid();
    }

    /// <summary>Ids from a list response. Members expose theirs as "memberId", not "id".</summary>
    public static IEnumerable<Guid> Ids(this JsonElement array, string property = "id") =>
        array.EnumerateArray().Select(item => item.GetGuid(property));

    public static IEnumerable<Guid> MemberIds(this JsonElement array) => array.Ids("memberId");

    public static bool IsBlocked(this HttpStatusCode status) =>
        status is HttpStatusCode.NotFound or HttpStatusCode.Forbidden or HttpStatusCode.Conflict;
}
