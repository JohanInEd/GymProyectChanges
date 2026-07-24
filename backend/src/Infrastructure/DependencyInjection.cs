using GymSaaS.Application.Abstractions;
using GymSaaS.Application.Services;
using GymSaaS.Domain.Entities;
using GymSaaS.Infrastructure.Auth;
using GymSaaS.Infrastructure.Billing;
using GymSaaS.Infrastructure.CheckIns;
using GymSaaS.Infrastructure.Email;
using GymSaaS.Infrastructure.Persistence;
using GymSaaS.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Identity;
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

        var postgresOptions = configuration.GetSection("Postgres").Get<PostgresOptions>() ?? new PostgresOptions();

        services.AddHttpContextAccessor();
        services.AddScoped<ITenantProvider, ClaimsTenantProvider>();
        services.AddScoped<IMembershipStatusService, MembershipStatusService>();
        services.AddScoped<IInviteCodeService, InviteCodeService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ISubscriptionAccessService, SubscriptionAccessService>();
        services.Configure<BillingOptions>(configuration.GetSection("Billing"));
        services.AddScoped<IAttendanceMaintenanceService, AttendanceMaintenanceService>();
        services.Configure<CheckInOptions>(configuration.GetSection("CheckIn"));
        services.AddScoped<IEmailSender, ConsoleEmailSender>();
        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.Configure<AccountLockoutOptions>(configuration.GetSection("AccountLockout"));

        services.AddDbContext<GymSaaSDbContext>(options =>
        {
            options.UseNpgsql(
                connectionString,
                npgsql => npgsql.CommandTimeout(postgresOptions.CommandTimeoutSeconds));

            if (postgresOptions.EnableSensitiveDataLogging)
            {
                options.EnableSensitiveDataLogging();
            }
        });

        return services;
    }
}
