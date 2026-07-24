using System.Net;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// Registering a client used to create the member and the membership but no payment at all, so the
/// value assigned to the client was never income: the chart stayed flat and reception had to capture
/// the same amount again in Finanzas. These pin the behaviour that replaced it — the registration
/// charges, and the charge lands where it belongs depending on whether the client actually paid.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class MemberRegistrationPaymentTests
{
    private readonly ApiFixture _fixture;

    public MemberRegistrationPaymentTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Registering_a_paid_member_counts_as_revenue_this_month()
    {
        using var gym = await _fixture.RegisterGymAsync("Cobro");
        await gym.CreatePlanAsync("Mensual", price: 120_000m);

        await gym.PostAsync("/api/members", MemberBody("Ana Paga", "Mensual", 120_000m, "Paid"));

        var summary = await gym.GetAsync("/api/finance/summary");
        Assert.Equal(120_000m, summary.GetProperty("currentMonthRevenue").GetDecimal());
        Assert.Equal(1, summary.GetProperty("currentMonthPaidPayments").GetInt32());

        var payment = Assert.Single(summary.GetProperty("recentPayments").EnumerateArray());
        Assert.Equal("Ana Paga", payment.GetProperty("memberName").GetString());
        Assert.Equal("Mensual", payment.GetProperty("planName").GetString());
        Assert.Equal("Efectivo", payment.GetProperty("method").GetString());
        Assert.Equal("Paid", payment.GetProperty("status").GetString());

        // The chart reads the last point of monthlyRevenue — this is the bar that stayed at zero.
        var monthly = summary.GetProperty("monthlyRevenue").EnumerateArray().Last();
        Assert.Equal(120_000m, monthly.GetProperty("revenue").GetDecimal());

        Assert.Empty(summary.GetProperty("accountsReceivable").EnumerateArray());
    }

    [Fact]
    public async Task Registering_an_unpaid_member_lands_in_receivables_and_not_in_revenue()
    {
        using var gym = await _fixture.RegisterGymAsync("Cobro");
        await gym.CreatePlanAsync("Mensual", price: 95_000m);

        await gym.PostAsync("/api/members", MemberBody("Beto Debe", "Mensual", 95_000m, "Pending"));

        var summary = await gym.GetAsync("/api/finance/summary");

        // Money that has not been collected is not income. This is the whole point of the toggle.
        Assert.Equal(0m, summary.GetProperty("currentMonthRevenue").GetDecimal());
        Assert.Equal(0, summary.GetProperty("currentMonthPaidPayments").GetInt32());
        Assert.Empty(summary.GetProperty("recentPayments").EnumerateArray());

        var receivable = Assert.Single(summary.GetProperty("accountsReceivable").EnumerateArray());
        Assert.Equal("Beto Debe", receivable.GetProperty("memberName").GetString());
        Assert.Equal(95_000m, receivable.GetProperty("amount").GetDecimal());
    }

    [Fact]
    public async Task Registering_without_a_payment_status_charges_nothing()
    {
        using var gym = await _fixture.RegisterGymAsync("Cobro");

        // The pre-July-2026 request shape, still used by CreateMemberAsync and by any API caller
        // that only wants to enrol someone. It must not invent a payment.
        await gym.CreateMemberAsync("Carla Sin Cobro");

        var summary = await gym.GetAsync("/api/finance/summary");
        Assert.Equal(0m, summary.GetProperty("currentMonthRevenue").GetDecimal());
        Assert.Empty(summary.GetProperty("recentPayments").EnumerateArray());
        Assert.Empty(summary.GetProperty("accountsReceivable").EnumerateArray());
    }

    [Fact]
    public async Task A_discount_is_charged_without_changing_the_plan_price()
    {
        using var gym = await _fixture.RegisterGymAsync("Cobro");
        var planId = await gym.CreatePlanAsync("Premium", price: 200_000m);

        var body = MemberBody("Diana Descuento", "Premium", 200_000m, "Paid");
        await gym.PostAsync("/api/members", body with { PaymentAmount = 150_000m });

        var summary = await gym.GetAsync("/api/finance/summary");
        Assert.Equal(150_000m, summary.GetProperty("currentMonthRevenue").GetDecimal());

        // A promo for one client must not rewrite what the plan costs everyone else.
        var plans = await gym.GetAsync("/api/plans");
        var plan = Assert.Single(plans.EnumerateArray(), p => p.GetGuid("id") == planId);
        Assert.Equal(200_000m, plan.GetProperty("price").GetDecimal());
    }

    [Fact]
    public async Task A_charge_without_a_plan_is_refused()
    {
        using var gym = await _fixture.RegisterGymAsync("Cobro");

        using var response = await gym.TryPostAsync("/api/members", new
        {
            fullName = "Sin Plan",
            paymentStatus = "Paid",
            paymentAmount = 50_000m,
            paymentMethod = "Efectivo"
        });

        // A payment hangs off a membership; without a plan there is nothing to charge for.
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty((await gym.GetAsync("/api/members")).EnumerateArray());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5000)]
    public async Task A_charge_of_zero_or_less_is_refused_and_creates_no_member(decimal amount)
    {
        using var gym = await _fixture.RegisterGymAsync("Cobro");
        await gym.CreatePlanAsync("Mensual");

        var body = MemberBody("Monto Invalido", "Mensual", 80_000m, "Paid");
        using var response = await gym.TryPostAsync("/api/members", body with { PaymentAmount = amount });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // Validation happens before anything is written: a rejected charge must not leave a member
        // stranded without the payment that was meant to go with it.
        Assert.Empty((await gym.GetAsync("/api/members")).EnumerateArray());
    }

    [Fact]
    public async Task An_unknown_payment_status_is_refused()
    {
        using var gym = await _fixture.RegisterGymAsync("Cobro");
        await gym.CreatePlanAsync("Mensual");

        var body = MemberBody("Estado Raro", "Mensual", 80_000m, "Regalado");
        using var response = await gym.TryPostAsync("/api/members", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty((await gym.GetAsync("/api/members")).EnumerateArray());
    }

    [Fact]
    public async Task One_gyms_registration_income_never_reaches_another()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");
        await alfa.CreatePlanAsync("Mensual", price: 120_000m);

        await alfa.PostAsync("/api/members", MemberBody("Cliente de Alfa", "Mensual", 120_000m, "Paid"));

        var betaSummary = await beta.GetAsync("/api/finance/summary");
        Assert.Equal(0m, betaSummary.GetProperty("currentMonthRevenue").GetDecimal());
        Assert.Empty(betaSummary.GetProperty("recentPayments").EnumerateArray());

        var alfaSummary = await alfa.GetAsync("/api/finance/summary");
        Assert.Equal(120_000m, alfaSummary.GetProperty("currentMonthRevenue").GetDecimal());
    }

    private static CreateMemberBody MemberBody(string name, string planName, decimal price, string paymentStatus) =>
        new()
        {
            FullName = name,
            Email = $"{Guid.NewGuid():N}@members.test",
            Phone = "3001234567",
            Gender = "F",
            Age = 30,
            PlanName = planName,
            SubscriptionValue = price,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            PaymentStatus = paymentStatus,
            PaymentAmount = price,
            PaymentMethod = "Efectivo"
        };

    /// <summary>A record so each test can vary one field with `with` instead of restating the body.</summary>
    private sealed record CreateMemberBody
    {
        public required string FullName { get; init; }
        public string? Email { get; init; }
        public string? Phone { get; init; }
        public string? Gender { get; init; }
        public int? Age { get; init; }
        public string? PlanName { get; init; }
        public decimal? SubscriptionValue { get; init; }
        public DateOnly? StartDate { get; init; }
        public string? PaymentStatus { get; init; }
        public decimal? PaymentAmount { get; init; }
        public string? PaymentMethod { get; init; }
    }
}
