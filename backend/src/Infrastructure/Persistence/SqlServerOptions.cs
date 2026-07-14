namespace GymSaaS.Infrastructure.Persistence;

public sealed class SqlServerOptions
{
    public bool EnableSensitiveDataLogging { get; set; }
    public int CommandTimeoutSeconds { get; set; } = 30;
}
