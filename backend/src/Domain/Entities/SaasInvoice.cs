using GymSaaS.Domain.Common;
using GymSaaS.Domain.Enums;

namespace GymSaaS.Domain.Entities;

/// <summary>
/// An invoice issued to a gym for its SaaS subscription. Amounts are decimal (money is never
/// an int or a char) and dates are real date types.
/// </summary>
public sealed class SaasInvoice : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "COP";
    public DateOnly IssuedAt { get; set; }
    public DateOnly? DueDate { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public SaasInvoiceStatus Status { get; set; } = SaasInvoiceStatus.Pending;
    public string? InvoiceUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Gym? Gym { get; set; }
}
