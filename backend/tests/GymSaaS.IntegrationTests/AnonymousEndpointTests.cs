using System.Net;
using System.Net.Http.Json;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// Endpoints reachable without a token are where tenant isolation cannot protect anything, because
/// there is no tenant to derive. The project already shipped one by accident — the prototype's
/// <c>register-and-pay</c>, which was <c>[AllowAnonymous]</c>, read <c>TenantId</c> from the request
/// body and called <c>IgnoreQueryFilters()</c>. It was deleted; these tests keep the door shut.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class AnonymousEndpointTests
{
    /// <summary>
    /// Every action that may be called without authentication, and why it has to be.
    /// A new entry here should be a deliberate decision reviewed on its own merits.
    /// </summary>
    private static readonly Dictionary<string, string> AllowedAnonymousActions = new()
    {
        ["AuthController.Login"] = "you cannot hold a token before logging in",
        ["AuthController.RegisterGym"] = "creates the first tenant; guarded by a single-use invite code",
        ["AuthController.ForgotPassword"] = "the user is locked out by definition; always returns the same generic reply",
        ["AuthController.ResetPassword"] = "authorised by the emailed single-use token instead",
        ["AuthController.VerifyEmail"] = "authorised by the emailed single-use token instead",
        ["InviteCodesController.Validate"] = "runs before any gym or account exists",
        ["InviteCodesController.Redeem"] = "runs before any gym or account exists"
    };

    private readonly ApiFixture _fixture;

    public AnonymousEndpointTests(ApiFixture fixture) => _fixture = fixture;

    /// <summary>
    /// Keeps the two reflection tests honest. If the scan ever stops finding actions — a renamed
    /// attribute, a moved assembly — they would pass while checking nothing at all.
    /// </summary>
    [Fact]
    public void The_allow_list_matches_the_endpoints_that_actually_exist()
    {
        var found = AnonymousActions().ToHashSet();

        Assert.NotEmpty(found);

        var stale = AllowedAnonymousActions.Keys.Where(action => !found.Contains(action)).OrderBy(a => a).ToList();
        Assert.True(
            stale.Count == 0,
            "These actions are on the anonymous allow-list but no longer exist or are no longer "
            + "anonymous. Remove them so the list keeps describing reality:\n  " + string.Join("\n  ", stale));
    }

    [Fact]
    public void No_undocumented_endpoint_is_reachable_without_a_token()
    {
        var unexpected = AnonymousActions()
            .Where(action => !AllowedAnonymousActions.ContainsKey(action))
            .OrderBy(action => action)
            .ToList();

        Assert.True(
            unexpected.Count == 0,
            "These actions can be called with no token at all, and they are not on the reviewed "
            + "allow-list. An anonymous endpoint has no tenant, so the query filters cannot protect "
            + "it — check that it cannot read or write another gym's data, then add it to "
            + "AllowedAnonymousActions with the reason:\n  " + string.Join("\n  ", unexpected));
    }

    /// <summary>
    /// Anything anonymous and guessable must be rate-limited, or it is a free brute-force target.
    /// </summary>
    [Fact]
    public void Every_anonymous_endpoint_is_rate_limited()
    {
        var unlimited = AnonymousActions()
            .Where(action => !IsRateLimited(action))
            .OrderBy(action => action)
            .ToList();

        Assert.True(
            unlimited.Count == 0,
            "These anonymous actions have no [EnableRateLimiting] policy, on the method or their "
            + "controller, so they can be hammered for free:\n  " + string.Join("\n  ", unlimited));
    }

    [Fact]
    public async Task The_prototype_self_service_endpoint_stays_deleted()
    {
        using var victim = await _fixture.RegisterGymAsync("Victima");

        using var anonymous = _fixture.CreateAnonymousClient();
        using var response = await anonymous.PostAsJsonAsync(
            "/api/subscriptions/self-service/register-and-pay",
            new
            {
                tenantId = victim.TenantId,
                planId = Guid.NewGuid(),
                firstName = "Intruso",
                lastName = "Anonimo",
                email = $"intruso-{Guid.NewGuid():N}@integration.test",
                paymentProvider = "test",
                paymentToken = "test-token"
            },
            Json.Options);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static IEnumerable<string> AnonymousActions() =>
        ActionMethods()
            .Where(IsAnonymous)
            .Select(method => $"{method.DeclaringType!.Name}.{method.Name}");

    private static IEnumerable<MethodInfo> ActionMethods() =>
        typeof(Program).Assembly.GetTypes()
            .Where(type => typeof(ControllerBase).IsAssignableFrom(type) && !type.IsAbstract)
            .SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
            .Where(method => !method.IsSpecialName)
            .Where(method => method.GetCustomAttributes<HttpMethodAttribute>(inherit: true).Any());

    private static bool IsAnonymous(MethodInfo method)
    {
        if (method.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true) is not null)
        {
            return true;
        }

        if (method.GetCustomAttribute<AuthorizeAttribute>(inherit: true) is not null)
        {
            return false;
        }

        var controller = method.DeclaringType!;
        return controller.GetCustomAttribute<AuthorizeAttribute>(inherit: true) is null;
    }

    private static bool IsRateLimited(string action)
    {
        var method = ActionMethods().Single(m => $"{m.DeclaringType!.Name}.{m.Name}" == action);

        return HasRateLimitingAttribute(method.GetCustomAttributes(inherit: true))
            || HasRateLimitingAttribute(method.DeclaringType!.GetCustomAttributes(inherit: true));
    }

    // Matched by name so the test does not need a compile-time reference to the rate-limiting types.
    private static bool HasRateLimitingAttribute(IEnumerable<object> attributes) =>
        attributes.Any(attribute => attribute.GetType().Name == "EnableRateLimitingAttribute");
}
