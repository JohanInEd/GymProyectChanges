using GymSaaS.Application.Abstractions;
using GymSaaS.Infrastructure.Auth;
using Microsoft.AspNetCore.Http;

namespace GymSaaS.Infrastructure.Tenancy;

public sealed class ClaimsTenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ClaimsTenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid CurrentTenantId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User.FindFirst(JwtTokenService.TenantIdClaimType)?.Value;

            if (!Guid.TryParse(value, out var tenantId))
            {
                throw new InvalidOperationException("The authenticated user does not have a valid tenant claim.");
            }

            return tenantId;
        }
    }
}
