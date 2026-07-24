namespace GymSaaS.Infrastructure.CheckIns;

/// <summary>Bound to the "CheckIn" configuration section.</summary>
public sealed class CheckInOptions
{
    /// <summary>
    /// Hours a visit may stay open before the system closes it on its own.
    /// Deliberately generous: a member can legitimately spend three hours between training, the
    /// sauna and waiting for a class, and closing a real visit is worse than closing a forgotten
    /// one late. Twelve hours behaves like "the next day" without needing to know the gym's time
    /// zone — which the system does not store, so a literal end-of-day rule would cut at 7pm in
    /// Colombia, with the gym still full.
    /// </summary>
    public double AutoCloseAfterHours { get; set; } = 12;

    /// <summary>
    /// Master switch, same idea as Billing:EnforceSubscription. Set to false to stop closing visits
    /// automatically without a deploy.
    /// </summary>
    public bool AutoCloseStaleVisits { get; set; } = true;
}
