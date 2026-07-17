namespace GymSaaS.Application.DTOs.Billing;

public sealed record SaasSubscriptionDto(
    Guid Id,
    string PlanType,
    DateOnly StartDate,
    DateOnly EndDate,
    string Status);

public sealed record SaasInvoiceDto(
    Guid Id,
    decimal Amount,
    string Currency,
    DateOnly IssuedAt,
    DateOnly? DueDate,
    DateTimeOffset? PaidAt,
    string Status,
    string? InvoiceUrl);

public sealed record BillingDto(
    SaasSubscriptionDto? Subscription,
    IReadOnlyList<SaasInvoiceDto> Invoices);
