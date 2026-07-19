namespace GymSaaS.Application.Abstractions;

/// <summary>What a gym is currently allowed to do, based on whether it is paying us.</summary>
public enum TenantAccessLevel
{
    /// <summary>Trial or subscription is current (or within the grace period).</summary>
    Full = 0,

    /// <summary>Expired: the gym keeps full read access to its own data but cannot write.</summary>
    ReadOnly = 1
}

/// <param name="Level">What the gym may do right now.</param>
/// <param name="EndDate">When the trial or subscription ran out, if it has.</param>
/// <param name="GraceEndsAt">Last day writes are still accepted.</param>
/// <param name="Reason">Message shown to the gym, in Spanish, matching the rest of the API.</param>
public sealed record TenantAccess(
    TenantAccessLevel Level,
    DateOnly? EndDate,
    DateOnly? GraceEndsAt,
    string? Reason)
{
    public bool IsReadOnly => Level == TenantAccessLevel.ReadOnly;

    public static TenantAccess Full(DateOnly? endDate = null, DateOnly? graceEndsAt = null) =>
        new(TenantAccessLevel.Full, endDate, graceEndsAt, null);
}

public interface ISubscriptionAccessService
{
    Task<TenantAccess> GetAccessAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
