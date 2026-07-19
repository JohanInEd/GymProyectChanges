using GymSaaS.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// The behavioural tests can only prove isolation for the entities they happen to exercise. These
/// inspect the EF model itself, so a table added next year is covered the day it is written — which
/// matters because forgetting a query filter produces no error, just a quiet leak.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class TenantFilterConfigurationTests
{
    /// <summary>
    /// Entities that deliberately have no tenant filter, with the reason. Adding to this list should
    /// be a conscious decision, which is exactly why the test fails when something new appears.
    /// </summary>
    private static readonly Dictionary<string, string> IntentionallyGlobal = new()
    {
        ["Gym"] = "the tenant itself; scoped by id in GymProfileController",
        ["User"] = "login must resolve the tenant from the email before any tenant context exists",
        ["InviteCode"] = "must be checkable before any gym exists",
        ["UserToken"] = "password-reset and verification links are resolved before login"
    };

    /// <summary>
    /// Files allowed to call IgnoreQueryFilters(), so the scan flags only new ones.
    /// Deliberately empty: production code has no legitimate reason to bypass tenant isolation
    /// today. Adding an entry should mean the query was reviewed and scoped by tenant by hand.
    /// </summary>
    private static readonly HashSet<string> KnownFilterBypasses = new(StringComparer.OrdinalIgnoreCase);

    private readonly ApiFixture _fixture;

    public TenantFilterConfigurationTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public void Every_tenant_scoped_entity_has_a_query_filter()
    {
        using var dbContext = _fixture.Database.CreateInspectionContext();

        var unfiltered = dbContext.Model.GetEntityTypes()
            .Where(entityType => typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType))
            .Where(entityType => entityType.GetQueryFilter() is null)
            .Select(entityType => entityType.ClrType.Name)
            .OrderBy(name => name)
            .ToList();

        Assert.True(
            unfiltered.Count == 0,
            "These entities implement ITenantScoped but have no global query filter, so every gym can "
            + "read every other gym's rows of them. Add a HasQueryFilter in GymSaaSDbContext:\n  "
            + string.Join("\n  ", unfiltered));
    }

    [Fact]
    public void Every_query_filter_actually_filters_on_TenantId()
    {
        using var dbContext = _fixture.Database.CreateInspectionContext();

        var wrong = dbContext.Model.GetEntityTypes()
            .Where(entityType => typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType))
            .Select(entityType => new { entityType.ClrType.Name, Filter = entityType.GetQueryFilter()?.ToString() ?? "" })
            .Where(x => !x.Filter.Contains(nameof(ITenantScoped.TenantId), StringComparison.Ordinal))
            .Select(x => $"{x.Name}: {x.Filter}")
            .ToList();

        Assert.True(
            wrong.Count == 0,
            "These entities have a query filter that does not mention TenantId, so it is not "
            + "isolating anything:\n  " + string.Join("\n  ", wrong));
    }

    [Fact]
    public void Only_the_documented_entities_are_exempt_from_tenant_filtering()
    {
        using var dbContext = _fixture.Database.CreateInspectionContext();

        var undocumented = dbContext.Model.GetEntityTypes()
            .Where(entityType => !typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType))
            .Select(entityType => entityType.ClrType.Name)
            .Where(name => !IntentionallyGlobal.ContainsKey(name))
            .OrderBy(name => name)
            .ToList();

        Assert.True(
            undocumented.Count == 0,
            "These entities are not tenant-scoped and are not on the documented exemption list. If "
            + "they hold per-gym data they need TenantId and a query filter; if they are genuinely "
            + "global, add them to IntentionallyGlobal with the reason:\n  "
            + string.Join("\n  ", undocumented));
    }

    /// <summary>
    /// A query filter is bypassed silently by IgnoreQueryFilters() or by raw SQL. Neither shows up in
    /// the model, so this checks the source instead.
    /// </summary>
    [Fact]
    public void No_new_production_code_bypasses_the_tenant_filters()
    {
        var backendSource = LocateBackendSource();

        var offenders = Directory
            .EnumerateFiles(backendSource, "*.cs", SearchOption.AllDirectories)
            .Where(path => !path.Contains($"{Path.DirectorySeparatorChar}Migrations{Path.DirectorySeparatorChar}"))
            .Select(path => new { Path = path, Text = File.ReadAllText(path) })
            .Where(file => file.Text.Contains("IgnoreQueryFilters", StringComparison.Ordinal))
            .Select(file => Path.GetRelativePath(backendSource, file.Path))
            .Where(path => !KnownFilterBypasses.Contains(path))
            .OrderBy(path => path)
            .ToList();

        Assert.True(
            offenders.Count == 0,
            "IgnoreQueryFilters() disables tenant isolation for that query, and nothing else will "
            + "warn you. If one of these is genuinely needed (a platform-operator report, say), scope "
            + "it by tenant explicitly and add it to KnownFilterBypasses with a reason:\n  "
            + string.Join("\n  ", offenders));
    }

    private static string LocateBackendSource()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, "backend", "src");
            if (Directory.Exists(candidate) && File.Exists(Path.Combine(directory.FullName, "CONTEXT.md")))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException(
            "Could not locate backend/src by walking up from " + AppContext.BaseDirectory +
            ". This test reads the production sources, so it must run from inside the repository.");
    }
}
