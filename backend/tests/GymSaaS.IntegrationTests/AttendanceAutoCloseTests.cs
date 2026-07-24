using System.Net;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// A visit nobody checked out used to be permanent. The filtered unique index on Attendances
/// ("AccessGranted" = true AND "CheckedOutAt" IS NULL) then refused the member's next entry, and the
/// only cure — "Validar salida" — is only offered while the visit is still inside the recent log the
/// screen loads. Past that, the member was locked out with no way to fix it from the UI.
/// These pin the automatic close that replaced it, including the part that matters most: it must not
/// invent an exit time, and it must not touch a visit that is genuinely in progress.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class AttendanceAutoCloseTests
{
    private readonly ApiFixture _fixture;

    public AttendanceAutoCloseTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task A_forgotten_exit_stops_blocking_the_next_entry()
    {
        using var gym = await _fixture.RegisterGymAsync("Asistencia");
        var memberId = await gym.CreateMemberAsync("Olvido Salida");

        await gym.PostAsync("/api/check-ins", new { memberId });
        await BackdateOpenVisitAsync(memberId, hours: 20);

        // This is the whole point: yesterday's forgotten visit must not stop today's entry.
        var second = await gym.PostAsync("/api/check-ins", new { memberId });
        Assert.True(second.GetProperty("accessGranted").GetBoolean());
    }

    [Fact]
    public async Task The_forgotten_visit_is_marked_and_keeps_no_invented_exit_time()
    {
        using var gym = await _fixture.RegisterGymAsync("Asistencia");
        var memberId = await gym.CreateMemberAsync("Marca Automatica");

        var first = await gym.PostAsync("/api/check-ins", new { memberId });
        var attendanceId = first.GetGuid("attendanceId");
        await BackdateOpenVisitAsync(memberId, hours: 20);

        var logs = await gym.GetAsync("/api/check-ins/recent?take=50");
        var closed = Assert.Single(logs.EnumerateArray(), log => log.GetGuid("attendanceId") == attendanceId);

        Assert.True(closed.GetProperty("autoClosed").GetBoolean());

        // Closed at the 12h cutoff after entry, not at the moment of the sweep. A visit that started
        // 20 hours ago must not be recorded as having ended just now — that would be a fabricated
        // observation, and the UI would show it as a real exit.
        var checkedOut = closed.GetProperty("checkedOutAt").GetDateTimeOffset();
        var checkedIn = closed.GetProperty("checkedInAt").GetDateTimeOffset();
        Assert.Equal(12, (checkedOut - checkedIn).TotalHours, precision: 1);
        Assert.True(
            checkedOut < DateTimeOffset.UtcNow.AddHours(-1),
            $"Expected the cutoff to sit well in the past, but it was {checkedOut:O}.");
    }

    [Fact]
    public async Task A_visit_in_progress_is_left_alone()
    {
        using var gym = await _fixture.RegisterGymAsync("Asistencia");
        var memberId = await gym.CreateMemberAsync("Sigue Adentro");

        var entry = await gym.PostAsync("/api/check-ins", new { memberId });
        var attendanceId = entry.GetGuid("attendanceId");

        // Someone training right now must still count as inside, and must still be refused a second
        // entry. Closing live visits would be a worse bug than the one being fixed.
        using var duplicate = await gym.TryPostAsync("/api/check-ins", new { memberId });
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);

        var logs = await gym.GetAsync("/api/check-ins/recent?take=50");
        var open = Assert.Single(logs.EnumerateArray(), log => log.GetGuid("attendanceId") == attendanceId);
        Assert.False(open.GetProperty("autoClosed").GetBoolean());
        Assert.Equal(JsonValueKindNull, open.GetProperty("checkedOutAt").ValueKind);
    }

    [Fact]
    public async Task Opening_the_check_in_screen_is_enough_to_clear_a_stale_visit()
    {
        using var gym = await _fixture.RegisterGymAsync("Asistencia");
        var memberId = await gym.CreateMemberAsync("Contador Inflado");

        await gym.PostAsync("/api/check-ins", new { memberId });
        await BackdateOpenVisitAsync(memberId, hours: 20);

        // Reading the log sweeps too, so "Personas dentro" is right as soon as the screen loads and
        // does not wait for somebody to attempt another entry.
        var logs = await gym.GetAsync("/api/check-ins/recent?take=50");
        var stillInside = logs.EnumerateArray()
            .Count(log => log.GetProperty("accessGranted").GetBoolean()
                && log.GetProperty("checkedOutAt").ValueKind == JsonValueKindNull);

        Assert.Equal(0, stillInside);
    }

    [Fact]
    public async Task A_real_check_out_is_never_marked_as_automatic()
    {
        using var gym = await _fixture.RegisterGymAsync("Asistencia");
        var memberId = await gym.CreateMemberAsync("Salida Real");

        var entry = await gym.PostAsync("/api/check-ins", new { memberId });
        var attendanceId = entry.GetGuid("attendanceId");
        await gym.PostAsync("/api/check-ins/check-out", new { memberId });

        var logs = await gym.GetAsync("/api/check-ins/recent?take=50");
        var log = Assert.Single(logs.EnumerateArray(), item => item.GetGuid("attendanceId") == attendanceId);

        Assert.False(log.GetProperty("autoClosed").GetBoolean());
        Assert.True(log.GetProperty("checkedOutAt").GetDateTimeOffset() > DateTimeOffset.UtcNow.AddMinutes(-5));
    }

    [Fact]
    public async Task Closing_one_gyms_stale_visits_never_touches_another_gyms()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");
        var alfaMember = await alfa.CreateMemberAsync("Socio de Alfa");
        var betaMember = await beta.CreateMemberAsync("Socio de Beta");

        await alfa.PostAsync("/api/check-ins", new { memberId = alfaMember });
        await beta.PostAsync("/api/check-ins", new { memberId = betaMember });
        await BackdateOpenVisitAsync(alfaMember, hours: 20);

        // The sweep runs inside Alfa's request, so the tenant filter is the only thing keeping it off
        // Beta's rows. Beta's member is still training and must stay inside.
        await alfa.GetAsync("/api/check-ins/recent?take=50");

        var betaLogs = await beta.GetAsync("/api/check-ins/recent?take=50");
        var betaVisit = Assert.Single(betaLogs.EnumerateArray());
        Assert.False(betaVisit.GetProperty("autoClosed").GetBoolean());
        Assert.Equal(JsonValueKindNull, betaVisit.GetProperty("checkedOutAt").ValueKind);

        using var stillBlocked = await beta.TryPostAsync("/api/check-ins", new { memberId = betaMember });
        Assert.Equal(HttpStatusCode.Conflict, stillBlocked.StatusCode);
    }

    private const System.Text.Json.JsonValueKind JsonValueKindNull = System.Text.Json.JsonValueKind.Null;

    /// <summary>
    /// Ages the member's open visit so the configured cutoff has passed. Done in the database rather
    /// than by shortening the threshold, so the tests exercise the real 12-hour default.
    /// </summary>
    private async Task BackdateOpenVisitAsync(Guid memberId, double hours)
    {
        await using var dbContext = _fixture.Database.CreateInspectionContext();
        var updated = await dbContext.Attendances
            .IgnoreQueryFilters()
            .Where(attendance => attendance.MemberId == memberId && attendance.CheckedOutAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(
                attendance => attendance.CheckedInAt,
                attendance => attendance.CheckedInAt.AddHours(-hours)));

        Assert.True(updated > 0, "Expected an open visit to backdate, but found none.");
    }
}
