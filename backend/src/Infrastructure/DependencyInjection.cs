using GymSaaS.Application.Abstractions;
using GymSaaS.Application.Services;
using GymSaaS.Infrastructure.Persistence;
using GymSaaS.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GymSaaS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Connection string 'DefaultConnection' is required.");
        }

        var sqlOptions = configuration.GetSection("SqlServer").Get<SqlServerOptions>() ?? new SqlServerOptions();

        services.AddHttpContextAccessor();
        services.AddScoped<ITenantProvider, HeaderTenantProvider>();
        services.AddScoped<IMembershipStatusService, MembershipStatusService>();

        services.AddDbContext<GymSaaSDbContext>(options =>
        {
            options.UseSqlServer(
                connectionString,
                sqlServer => sqlServer.CommandTimeout(sqlOptions.CommandTimeoutSeconds));

            if (sqlOptions.EnableSensitiveDataLogging)
            {
                options.EnableSensitiveDataLogging();
            }
        });

        return services;
    }
}
