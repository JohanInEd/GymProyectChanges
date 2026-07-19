using GymSaaS.Application.Abstractions;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// Owns a throwaway PostgreSQL database for one test run.
/// <para>
/// A real PostgreSQL is required rather than the EF in-memory provider: the behaviour under test
/// *is* the provider-level query filtering, and the schema uses Postgres-specific SQL (the filtered
/// unique index on Attendances). An in-memory provider would pass while production broke.
/// </para>
/// </summary>
public sealed class TestDatabase : IAsyncDisposable
{
    // Same id as backend/src/API/GymSaaS.Api.csproj, so a developer who already ran
    // `dotnet user-secrets set ConnectionStrings:DefaultConnection ...` needs no extra setup.
    private const string ApiUserSecretsId = "c6224f39-6521-49a4-92ec-0e1d00fcf7ed";

    private readonly string _adminConnectionString;

    private TestDatabase(string connectionString, string adminConnectionString, string databaseName)
    {
        ConnectionString = connectionString;
        _adminConnectionString = adminConnectionString;
        DatabaseName = databaseName;
    }

    public string ConnectionString { get; }

    public string DatabaseName { get; }

    public static async Task<TestDatabase> CreateAsync()
    {
        var template = ResolveTemplateConnectionString();
        var databaseName = $"gymsaas_test_{Guid.NewGuid():N}"[..40];

        var target = new NpgsqlConnectionStringBuilder(template) { Database = databaseName }.ConnectionString;
        var admin = new NpgsqlConnectionStringBuilder(template) { Database = "postgres" }.ConnectionString;

        await using (var connection = new NpgsqlConnection(admin))
        {
            try
            {
                await connection.OpenAsync();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"""
                     Could not reach PostgreSQL to create the test database.

                     These are integration tests: they need a running PostgreSQL. On this machine it is
                     not a Windows service, so start it first:

                         D:\pgsql\bin\pg_ctl -D D:\pgdata -l D:\pgdata\server.log start

                     The connection string is read from the GYMSAAS_TEST_CONNECTION environment variable,
                     falling back to the API's user-secrets entry ConnectionStrings:DefaultConnection.

                     Underlying error: {ex.Message}
                     """, ex);
            }

            await using var command = connection.CreateCommand();
            command.CommandText = $"CREATE DATABASE \"{databaseName}\"";
            await command.ExecuteNonQueryAsync();
        }

        return new TestDatabase(target, admin, databaseName);
    }

    /// <summary>
    /// A DbContext for looking at the raw database, so tests can prove a row really exists while
    /// being invisible through the API — otherwise "gym B sees nothing" would pass just as well if
    /// nothing had ever been written.
    /// <para>
    /// <b>Every query on a tenant-scoped entity must call <c>.IgnoreQueryFilters()</c>.</b> Passing a
    /// null provider does not work: EF evaluates <c>_tenantProvider.CurrentTenantId</c> when it
    /// extracts query parameters, before the <c>_tenantProvider == null ||</c> short-circuit can
    /// apply, so it throws instead of returning everything. The provider below therefore throws a
    /// readable error rather than quietly returning zero rows, which would turn a forgotten
    /// IgnoreQueryFilters() into a test that passes for the wrong reason.
    /// </para>
    /// </summary>
    public GymSaaSDbContext CreateInspectionContext()
    {
        var options = new DbContextOptionsBuilder<GymSaaSDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        return new GymSaaSDbContext(options, new ExplodingTenantProvider());
    }

    private sealed class ExplodingTenantProvider : ITenantProvider
    {
        public Guid CurrentTenantId => throw new InvalidOperationException(
            "This inspection DbContext has no tenant. Add .IgnoreQueryFilters() to the query — "
            + "inspection queries are meant to read across every tenant.");
    }

    public async ValueTask DisposeAsync()
    {
        // Pooled connections to the test database would block the DROP.
        NpgsqlConnection.ClearAllPools();

        await using var connection = new NpgsqlConnection(_adminConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = $"DROP DATABASE IF EXISTS \"{DatabaseName}\" WITH (FORCE)";
        await command.ExecuteNonQueryAsync();
    }

    private static string ResolveTemplateConnectionString()
    {
        var fromEnvironment = Environment.GetEnvironmentVariable("GYMSAAS_TEST_CONNECTION");
        if (!string.IsNullOrWhiteSpace(fromEnvironment))
        {
            return fromEnvironment;
        }

        var configuration = new ConfigurationBuilder()
            .AddUserSecrets(ApiUserSecretsId)
            .Build();

        var fromSecrets = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(fromSecrets))
        {
            return fromSecrets;
        }

        throw new InvalidOperationException(
            """
            No PostgreSQL connection string available for the integration tests.

            Set one of:
              - the GYMSAAS_TEST_CONNECTION environment variable, or
              - the API's user-secrets, from backend/src/API:
                    dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=GymSaaS_Dev;Username=postgres;Password=<local password>"

            The tests never touch that database: they only borrow its host/credentials and create a
            disposable gymsaas_test_* database of their own.
            """);
    }
}
