using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// Boots the real application (the actual Program.cs pipeline: JWT bearer auth, the TenantStaff
/// policy, rate limiting, middleware and every controller) against a throwaway database.
/// Only the database connection is redirected — no service is stubbed, because the point of these
/// tests is the production wiring itself.
/// </summary>
public sealed class GymApiFactory : WebApplicationFactory<Program>
{
    /// <summary>
    /// Requests carrying this header are rate-limited under the given partition key. Without it each
    /// request gets a unique client IP, so the 10-per-minute auth limiter never makes unrelated
    /// tests flaky just because they happen to run together.
    /// </summary>
    public const string ClientIpHeader = "X-Test-Client-Ip";

    private readonly string _connectionString;

    public GymApiFactory(string connectionString) => _connectionString = connectionString;

    /// <summary>
    /// The JWT settings the running application actually resolved. Read from the live host rather
    /// than hard-coded, so tests that mint or tamper with tokens stay correct no matter which
    /// configuration source wins.
    /// </summary>
    public string SigningKey => Configuration["Jwt:SigningKey"]
        ?? throw new InvalidOperationException("Jwt:SigningKey is not configured.");

    public string Issuer => Configuration["Jwt:Issuer"]
        ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");

    public string Audience => Configuration["Jwt:Audience"]
        ?? throw new InvalidOperationException("Jwt:Audience is not configured.");

    private IConfiguration Configuration => Services.GetRequiredService<IConfiguration>();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _connectionString,
                ["Frontend:BaseUrl"] = "https://tests.local",
                ["Cors:AllowedOrigins:0"] = "https://tests.local"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Runs after the application's own registrations, so this is the one override that
            // cannot lose a configuration-precedence argument: whatever DefaultConnection ended up
            // being, the tests are pinned to their disposable database and can never reach a real one.
            RemoveDbContextRegistrations(services);

            services.AddDbContext<GymSaaSDbContext>(options =>
                options.UseNpgsql(_connectionString, npgsql => npgsql.CommandTimeout(30)));

            services.AddSingleton<IStartupFilter, ClientIpStartupFilter>();
        });
    }

    private static void RemoveDbContextRegistrations(IServiceCollection services)
    {
        var stale = services
            .Where(descriptor =>
                descriptor.ServiceType == typeof(DbContextOptions<GymSaaSDbContext>) ||
                descriptor.ServiceType == typeof(DbContextOptions) ||
                descriptor.ServiceType == typeof(GymSaaSDbContext))
            .ToList();

        foreach (var descriptor in stale)
        {
            services.Remove(descriptor);
        }
    }

    /// <summary>
    /// Inserted ahead of the application pipeline so it runs before UseRateLimiter.
    /// TestServer leaves Connection.RemoteIpAddress null, which would put every request in the
    /// limiter's single "unknown" partition and make test outcomes depend on execution order.
    /// </summary>
    private sealed class ClientIpStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
        {
            app.Use(async (context, nextMiddleware) =>
            {
                var requested = context.Request.Headers[ClientIpHeader].ToString();
                context.Connection.RemoteIpAddress =
                    System.Net.IPAddress.TryParse(requested, out var pinned)
                        ? pinned
                        : RandomIpAddress();

                await nextMiddleware();
            });

            next(app);
        };

        private static System.Net.IPAddress RandomIpAddress()
        {
            Span<byte> octets = stackalloc byte[4];
            Random.Shared.NextBytes(octets);
            return new System.Net.IPAddress(octets);
        }
    }
}
