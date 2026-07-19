namespace GymSaaS.Infrastructure.Billing;

/// <summary>Bound to the "Billing" configuration section.</summary>
public sealed class BillingOptions
{
    /// <summary>
    /// Days after the trial or subscription end date during which writes are still accepted.
    /// Absorbs weekends and bank-transfer delays so a customer who is genuinely paying is not
    /// locked out over a couple of hours.
    /// </summary>
    public int GraceDays { get; set; } = 1;

    /// <summary>
    /// Master switch. Set to false to go back to the previous behaviour (status stored and shown,
    /// never enforced) without a deploy — useful if enforcement ever misfires on a real customer.
    /// </summary>
    public bool EnforceSubscription { get; set; } = true;
}
