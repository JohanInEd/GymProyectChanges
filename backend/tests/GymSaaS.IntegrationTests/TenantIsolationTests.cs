using System.Net;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// The guarantee this project exists to protect: two gyms registered on the same deployment must
/// never see or touch each other's data.
/// <para>
/// It is enforced in one place — the global query filters in GymSaaSDbContext, fed by the tenant_id
/// claim on the signed JWT — so a regression here would be silent: no exception, no failing build,
/// just one gym reading another's members. Hence these tests.
/// </para>
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class TenantIsolationTests
{
    private readonly ApiFixture _fixture;

    public TenantIsolationTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Two_registered_gyms_get_distinct_tenants()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        Assert.NotEqual(Guid.Empty, alfa.TenantId);
        Assert.NotEqual(alfa.TenantId, beta.TenantId);

        // The tenant a gym operates as must come from the server's own record of the user,
        // never from anything the client can choose.
        await using var dbContext = _fixture.Database.CreateInspectionContext();
        var storedOwner = await dbContext.Users.SingleAsync(u => u.Id == alfa.OwnerUserId);
        Assert.Equal(alfa.TenantId, storedOwner.TenantId);
    }

    [Fact]
    public async Task A_new_gym_starts_with_an_empty_workspace()
    {
        using var busy = await _fixture.RegisterGymAsync("Ocupado");
        await busy.CreateMemberAsync("Cliente Existente");
        await busy.CreatePlanAsync($"Plan-{Guid.NewGuid():N}"[..20]);
        await busy.CreateProductAsync($"SKU-{Guid.NewGuid():N}"[..16], "Proteina");

        using var fresh = await _fixture.RegisterGymAsync("Nuevo");

        Assert.Empty((await fresh.GetAsync("/api/members")).EnumerateArray());
        Assert.Empty((await fresh.GetAsync("/api/plans")).EnumerateArray());
        Assert.Empty((await fresh.GetAsync("/api/products")).EnumerateArray());
        Assert.Empty((await fresh.GetAsync("/api/classes")).EnumerateArray());
        Assert.Empty((await fresh.GetAsync("/api/check-ins/recent")).EnumerateArray());
    }

    [Fact]
    public async Task Listing_endpoints_never_leak_another_gyms_rows()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        var memberId = await alfa.CreateMemberAsync("Ana Alfa");
        var planId = await alfa.CreatePlanAsync($"PlanAlfa{Guid.NewGuid():N}"[..20]);
        var productId = await alfa.CreateProductAsync($"ALFA{Guid.NewGuid():N}"[..14], "Creatina Alfa");
        var templateId = await alfa.CreateClassTemplateAsync($"Spinning{Guid.NewGuid():N}"[..18]);
        var classId = await alfa.CreateClassAsync("Funcional Alfa");
        var equipmentId = await alfa.CreateEquipmentAsync("Trotadora Alfa");
        var shiftId = await alfa.CreateShiftAsync("Empleado Alfa");
        var staffId = await alfa.CreateStaffAsync();
        await alfa.PostAsync("/api/check-ins", new { memberId });
        await alfa.PostAsync("/api/progress/records", new
        {
            memberId,
            date = DateOnly.FromDateTime(DateTime.UtcNow),
            weightKg = 62.5m
        });

        // Alfa sees its own rows...
        Assert.Contains(memberId, (await alfa.GetAsync("/api/members")).MemberIds());
        Assert.Contains(planId, (await alfa.GetAsync("/api/plans")).Ids());
        Assert.Contains(productId, (await alfa.GetAsync("/api/products")).Ids());
        Assert.Contains(classId, (await alfa.GetAsync("/api/classes")).Ids());
        Assert.Contains(templateId, (await alfa.GetAsync("/api/classes/templates")).Ids());
        Assert.NotEmpty((await alfa.GetAsync("/api/check-ins/recent")).EnumerateArray());

        // ...and Beta sees none of them.
        Assert.DoesNotContain(memberId, (await beta.GetAsync("/api/members")).MemberIds());
        Assert.DoesNotContain(planId, (await beta.GetAsync("/api/plans")).Ids());
        Assert.DoesNotContain(productId, (await beta.GetAsync("/api/products")).Ids());
        Assert.DoesNotContain(classId, (await beta.GetAsync("/api/classes")).Ids());
        Assert.DoesNotContain(templateId, (await beta.GetAsync("/api/classes/templates")).Ids());
        Assert.DoesNotContain(staffId, (await beta.GetAsync("/api/staff")).Ids());

        var betaAttendances = await beta.GetAsync("/api/check-ins/recent");
        Assert.DoesNotContain(memberId, betaAttendances.EnumerateArray().Select(a => a.GetGuid("memberId")));

        var betaOperations = await beta.GetAsync("/api/operations");
        Assert.DoesNotContain(equipmentId, betaOperations.GetProperty("equipment").Ids());
        Assert.DoesNotContain(shiftId, betaOperations.GetProperty("shifts").Ids());

        var betaProgress = await beta.GetAsync("/api/progress");
        Assert.Empty(betaProgress.GetProperty("records").EnumerateArray());

        // The rows genuinely exist — Beta's empty lists are isolation, not an empty database.
        await using var dbContext = _fixture.Database.CreateInspectionContext();
        Assert.True(await dbContext.Members.IgnoreQueryFilters().AnyAsync(m => m.Id == memberId));
        Assert.True(await dbContext.Products.IgnoreQueryFilters().AnyAsync(p => p.Id == productId));
        Assert.True(await dbContext.Equipment.IgnoreQueryFilters().AnyAsync(e => e.Id == equipmentId));
    }

    [Fact]
    public async Task Money_is_isolated_between_gyms()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        var alfaMember = await alfa.CreateMemberAsync("Pagador Alfa");
        await alfa.RegisterPaymentAsync(alfaMember, 250_000m);
        await alfa.RegisterExpenseAsync("Servicios", 40_000m);

        var alfaSummary = await alfa.GetAsync("/api/finance/summary");
        Assert.Equal(250_000m, alfaSummary.GetProperty("currentMonthRevenue").GetDecimal());
        Assert.Equal(40_000m, alfaSummary.GetProperty("currentMonthExpenses").GetDecimal());

        var betaSummary = await beta.GetAsync("/api/finance/summary");
        Assert.Equal(0m, betaSummary.GetProperty("currentMonthRevenue").GetDecimal());
        Assert.Equal(0m, betaSummary.GetProperty("currentMonthExpenses").GetDecimal());
        Assert.Empty(betaSummary.GetProperty("recentPayments").EnumerateArray());
        Assert.Empty(betaSummary.GetProperty("recentExpenses").EnumerateArray());
    }

    [Fact]
    public async Task A_gym_only_sees_its_own_saas_billing_and_profile()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        var alfaProfile = await alfa.GetAsync("/api/gym");
        var betaProfile = await beta.GetAsync("/api/gym");
        Assert.NotEqual(
            alfaProfile.GetProperty("gymName").GetString(),
            betaProfile.GetProperty("gymName").GetString());
        Assert.Equal(alfa.OwnerEmail, alfaProfile.GetProperty("adminEmail").GetString());
        Assert.Equal(beta.OwnerEmail, betaProfile.GetProperty("adminEmail").GetString());

        // Each gym gets exactly one trial subscription — its own.
        var alfaBilling = await alfa.GetAsync("/api/billing");
        var betaBilling = await beta.GetAsync("/api/billing");
        var alfaSubscriptionId = alfaBilling.GetProperty("subscription").GetGuid("id");
        var betaSubscriptionId = betaBilling.GetProperty("subscription").GetGuid("id");
        Assert.NotEqual(alfaSubscriptionId, betaSubscriptionId);
        Assert.Empty(betaBilling.GetProperty("invoices").EnumerateArray());
    }

    /// <summary>
    /// The important half. Not seeing another gym's ids in a list is weak protection if guessing or
    /// leaking an id is enough to act on it, so every by-id endpoint is exercised with a real id
    /// belonging to the *other* gym.
    /// </summary>
    [Fact]
    public async Task Cross_tenant_access_by_id_is_refused_on_every_endpoint()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        var memberId = await alfa.CreateMemberAsync("Victima Alfa");
        var planId = await alfa.CreatePlanAsync($"PlanAlfa{Guid.NewGuid():N}"[..20]);
        var productId = await alfa.CreateProductAsync($"ALFA{Guid.NewGuid():N}"[..14], "Producto Alfa");
        var classId = await alfa.CreateClassAsync("Clase Alfa");
        var templateId = await alfa.CreateClassTemplateAsync($"Yoga{Guid.NewGuid():N}"[..16]);
        var equipmentId = await alfa.CreateEquipmentAsync("Equipo Alfa");
        var shiftId = await alfa.CreateShiftAsync("Turno Alfa");
        var staffId = await alfa.CreateStaffAsync();
        var goal = await alfa.PostAsync("/api/progress/goals", new
        {
            memberId,
            title = "Meta Alfa",
            targetValue = 70m,
            unit = "kg"
        });
        var goalId = goal.GetGuid("id");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var attempts = new (string Description, Func<Task<HttpResponseMessage>> Call)[]
        {
            ("edit member",        () => beta.TryPutAsync($"/api/members/{memberId}", new { fullName = "Secuestrado" })),
            ("delete member",      () => beta.TryDeleteAsync($"/api/members/{memberId}")),
            ("renew membership",   () => beta.TryPutAsync($"/api/members/{memberId}/membership", new { startDate = today, endDate = today.AddDays(90), planName = "Anual" })),
            ("suspend member",     () => beta.TryPostAsync($"/api/members/{memberId}/suspend", new { })),
            ("delete plan",        () => beta.TryDeleteAsync($"/api/plans/{planId}")),
            ("update stock",       () => beta.TryPutAsync($"/api/products/{productId}/stock", new { stock = 0 })),
            ("delete product",     () => beta.TryDeleteAsync($"/api/products/{productId}")),
            ("register payment",   () => beta.TryPostAsync("/api/finance/payments", new { memberId, amount = 1m, paymentMethod = "Efectivo" })),
            ("check in",           () => beta.TryPostAsync("/api/check-ins", new { memberId })),
            ("check out",          () => beta.TryPostAsync("/api/check-ins/check-out", new { memberId })),
            ("delete class",       () => beta.TryDeleteAsync($"/api/classes/{classId}")),
            ("delete template",    () => beta.TryDeleteAsync($"/api/classes/templates/{templateId}")),
            ("reserve class",      () => beta.TryPostAsync("/api/classes/reservations", new { classId, memberId })),
            ("add progress",       () => beta.TryPostAsync("/api/progress/records", new { memberId, date = today, weightKg = 99m })),
            ("add goal",           () => beta.TryPostAsync("/api/progress/goals", new { memberId, title = "Intruso" })),
            ("toggle goal",        () => beta.TryPostAsync($"/api/progress/goals/{goalId}/toggle", new { })),
            ("add note",           () => beta.TryPostAsync("/api/progress/notes", new { memberId, text = "Intruso" })),
            ("equipment status",   () => beta.TryPutAsync($"/api/operations/equipment/{equipmentId}/status", new { status = "Averiado" })),
            ("delete equipment",   () => beta.TryDeleteAsync($"/api/operations/equipment/{equipmentId}")),
            ("delete shift",       () => beta.TryDeleteAsync($"/api/operations/shifts/{shiftId}")),
            ("toggle staff",       () => beta.TryPostAsync($"/api/staff/{staffId}/toggle", new { }))
        };

        var leaks = new List<string>();
        foreach (var (description, call) in attempts)
        {
            using var response = await call();

            if (response.IsSuccessStatusCode)
            {
                leaks.Add($"{description}: allowed ({(int)response.StatusCode})");
                continue;
            }

            // A 5xx would mean the request reached logic it should never have reached.
            if (!response.StatusCode.IsBlocked())
            {
                leaks.Add($"{description}: blocked with an unexpected {(int)response.StatusCode} {response.StatusCode}");
            }
        }

        Assert.True(leaks.Count == 0, "Cross-tenant operations that were not properly refused:\n  " + string.Join("\n  ", leaks));
    }

    [Fact]
    public async Task Alfas_data_survives_everything_Beta_tried()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        var memberId = await alfa.CreateMemberAsync("Intacta Alfa");
        var productId = await alfa.CreateProductAsync($"ALFA{Guid.NewGuid():N}"[..14], "Producto Intacto");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        using (var _ = await beta.TryPutAsync($"/api/members/{memberId}", new { fullName = "Nombre Robado" })) { }
        using (var _ = await beta.TryDeleteAsync($"/api/members/{memberId}")) { }
        using (var _ = await beta.TryPostAsync($"/api/members/{memberId}/suspend", new { })) { }
        using (var _ = await beta.TryPutAsync($"/api/products/{productId}/stock", new { stock = 0 })) { }
        using (var _ = await beta.TryDeleteAsync($"/api/products/{productId}")) { }
        using (var _ = await beta.TryPutAsync($"/api/members/{memberId}/membership", new { startDate = today, endDate = today, planName = "Diario" })) { }

        // Read the raw rows, bypassing the filters, so this checks the database and not the API.
        await using var dbContext = _fixture.Database.CreateInspectionContext();

        var member = await dbContext.Members.IgnoreQueryFilters().AsNoTracking().SingleAsync(m => m.Id == memberId);
        Assert.Equal("Intacta Alfa", member.FullName);
        Assert.True(member.IsActive);
        Assert.Equal(alfa.TenantId, member.TenantId);

        var product = await dbContext.Products.IgnoreQueryFilters().AsNoTracking().SingleAsync(p => p.Id == productId);
        Assert.Equal(10, product.Stock);

        var subscription = await dbContext.Subscriptions.IgnoreQueryFilters().AsNoTracking().SingleAsync(s => s.MemberId == memberId);
        Assert.NotEqual(today, subscription.EndDate);
    }

    [Fact]
    public async Task An_id_from_another_gym_is_indistinguishable_from_one_that_does_not_exist()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");

        var realButForeignId = await alfa.CreateMemberAsync("Ana Alfa");
        var inventedId = Guid.NewGuid();

        using var foreign = await beta.TryDeleteAsync($"/api/members/{realButForeignId}");
        using var invented = await beta.TryDeleteAsync($"/api/members/{inventedId}");

        // Same status either way: the API must not become an oracle for "this id exists elsewhere".
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
        Assert.Equal(invented.StatusCode, foreign.StatusCode);
    }
}
