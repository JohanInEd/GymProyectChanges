namespace GymSaaS.Application.Abstractions;

public interface ITenantProvider
{
    Guid CurrentTenantId { get; }
}
