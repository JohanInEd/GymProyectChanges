using GymSaaS.Application.Abstractions;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GymSaaS.Infrastructure.Billing;

/// <summary>
/// Decides whether a gym's own SaaS subscription still entitles it to write.
/// <para>
/// State is derived from the subscription row on each check rather than stored, so no scheduled job
/// is needed to flip statuses at midnight — there is no scheduler in this application.
/// </para>
/// </summary>
public sealed class SubscriptionAccessService : ISubscriptionAccessService
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly BillingOptions _options;

    public SubscriptionAccessService(GymSaaSDbContext dbContext, IOptions<BillingOptions> options)
    {
        _dbContext = dbContext;
        _options = options.Value;
    }

    public async Task<TenantAccess> GetAccessAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (!_options.EnforceSubscription)
        {
            return TenantAccess.Full();
        }

        var subscription = await _dbContext.SaasSubscriptions
            .AsNoTracking()
            .Where(s => s.TenantId == tenantId)
            .OrderByDescending(s => s.EndDate)
            .ThenByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        // Deliberately fail open. A gym with no subscription row (one created before SaaS billing
        // existed, or a data problem on our side) keeps working. Locking out a paying customer by
        // accident is a worse failure than a few unbilled days.
        if (subscription is null)
        {
            return TenantAccess.Full();
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var graceEndsAt = subscription.EndDate.AddDays(_options.GraceDays);

        if (subscription.Status == SaasSubscriptionStatus.Cancelled)
        {
            return new TenantAccess(
                TenantAccessLevel.ReadOnly,
                subscription.EndDate,
                graceEndsAt,
                "La suscripcion de este gimnasio esta cancelada. Puedes consultar tu informacion, "
                + "pero no registrar cambios. Escribenos para reactivarla.");
        }

        if (today <= graceEndsAt)
        {
            return TenantAccess.Full(subscription.EndDate, graceEndsAt);
        }

        var expired = subscription.Status == SaasSubscriptionStatus.Trial
            ? "Tu prueba gratuita termino"
            : "Tu suscripcion vencio";

        return new TenantAccess(
            TenantAccessLevel.ReadOnly,
            subscription.EndDate,
            graceEndsAt,
            $"{expired} el {subscription.EndDate:dd/MM/yyyy}. Tu informacion sigue disponible para "
            + "consulta, pero no puedes registrar cambios hasta renovar.");
    }
}
