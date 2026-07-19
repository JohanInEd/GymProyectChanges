using System.Security.Claims;
using System.Text.Json;
using GymSaaS.Application.Abstractions;
using GymSaaS.Infrastructure.Auth;

namespace GymSaaS.API.Middleware;

/// <summary>
/// Blocks writes for a gym whose trial or subscription has run out, while leaving all reads intact.
/// <para>
/// Reads stay open on purpose: a customer must always be able to see, check and export their own
/// data, including the invoice they are being asked to pay. Holding their gym's records hostage
/// would be both a bad way to collect and a bad answer to a data-access request.
/// </para>
/// <para>
/// Runs after authentication and authorization so the tenant is already established from the signed
/// token. It never decides *who* you are — only whether that gym is currently paying.
/// </para>
/// </summary>
public sealed class SubscriptionEnforcementMiddleware
{
    /// <summary>
    /// Paths exempt even when expired. Everything here is either how the gym signs in or how it
    /// finds out what it owes — locking these would leave a customer with no way back.
    /// </summary>
    private static readonly string[] ExemptPrefixes =
    {
        "/api/auth",
        "/api/billing",
        "/api/invite-codes"
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<SubscriptionEnforcementMiddleware> _logger;

    public SubscriptionEnforcementMiddleware(
        RequestDelegate next,
        ILogger<SubscriptionEnforcementMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ISubscriptionAccessService accessService)
    {
        if (!ShouldCheck(context))
        {
            await _next(context);
            return;
        }

        var rawTenantId = context.User.FindFirst(JwtTokenService.TenantIdClaimType)?.Value;
        if (!Guid.TryParse(rawTenantId, out var tenantId))
        {
            // No usable tenant: not this middleware's problem. The tenant provider will fail loudly.
            await _next(context);
            return;
        }

        var access = await accessService.GetAccessAsync(tenantId, context.RequestAborted);
        if (!access.IsReadOnly)
        {
            await _next(context);
            return;
        }

        _logger.LogInformation(
            "Write blocked for tenant {TenantId} on {Method} {Path}: subscription ended {EndDate}",
            tenantId,
            context.Request.Method,
            context.Request.Path,
            access.EndDate);

        context.Response.Clear();
        context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
        context.Response.ContentType = "application/json";

        // Plain-string body, the shape the frontend already knows how to surface.
        await context.Response.WriteAsync(
            JsonSerializer.Serialize(access.Reason ?? "Tu suscripcion no esta activa."),
            context.RequestAborted);
    }

    private static bool ShouldCheck(HttpContext context)
    {
        if (IsReadOnlyMethod(context.Request.Method))
        {
            return false;
        }

        if (context.User.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        var path = context.Request.Path;
        foreach (var prefix in ExemptPrefixes)
        {
            if (path.StartsWithSegments(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsReadOnlyMethod(string method) =>
        HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method);
}
