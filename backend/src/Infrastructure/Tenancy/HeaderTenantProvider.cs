using GymSaaS.Application.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Linq;

namespace GymSaaS.Infrastructure.Tenancy;

public sealed class HeaderTenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly string _headerName;

    public HeaderTenantProvider(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _headerName = configuration["Tenant:HeaderName"] ?? "X-Tenant-Id";
    }

    public Guid CurrentTenantId
    {
        get
        {
            var headers = _httpContextAccessor.HttpContext?.Request.Headers;
            var value = headers is null ? null : headers[_headerName].FirstOrDefault();

            if (!Guid.TryParse(value, out var tenantId))
            {
                throw new InvalidOperationException($"Tenant header '{_headerName}' is required.");
            }

            return tenantId;
        }
    }
}
