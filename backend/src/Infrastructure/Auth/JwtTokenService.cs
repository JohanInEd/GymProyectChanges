using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GymSaaS.Application.Abstractions;
using GymSaaS.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace GymSaaS.Infrastructure.Auth;

public sealed class JwtTokenService : IJwtTokenService
{
    public const string TenantIdClaimType = "tenant_id";

    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public string CreateToken(User user)
    {
        // ClaimTypes.NameIdentifier is set explicitly (alongside the JWT-standard "sub") rather than
        // relying on AddJwtBearer's inbound claim-type mapping, whose default has changed across
        // Microsoft.IdentityModel versions and isn't safe to depend on implicitly.
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(TenantIdClaimType, user.TenantId.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_options.ExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
