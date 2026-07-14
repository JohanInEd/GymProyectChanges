namespace GymSaaS.Infrastructure.Persistence;

public sealed class PostgresOptions
{
    public bool EnableSensitiveDataLogging { get; set; }
    public int CommandTimeoutSeconds { get; set; } = 30;
}
