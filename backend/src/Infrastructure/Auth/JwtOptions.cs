namespace GymSaaS.Infrastructure.Auth;

public sealed class JwtOptions
{
    public required string Issuer { get; set; }
    public required string Audience { get; set; }
    public required string SigningKey { get; set; }
    public int ExpiryMinutes { get; set; } = 720;
}
