namespace GymSaaS.Application.DTOs.Members;

public sealed record CreateMemberRequest(
    string FullName,
    string? Email,
    string? Phone,
    string? Gender,
    int? Age,
    string? PlanName,
    decimal? SubscriptionValue,
    DateOnly? StartDate,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? ChestCm,
    decimal? ArmCm,
    decimal? WaistCm,
    decimal? HipCm,
    decimal? LegCm,
    // Cobro de la inscripcion. PaymentStatus es lo que decide si se registra el pago:
    // "Paid" suma al ingreso del mes, "Pending" alimenta la cartera por cobrar, y
    // null/vacio no crea ningun pago (comportamiento previo a julio 2026).
    // PaymentAmount es lo que el cliente realmente paga y puede diferir de
    // SubscriptionValue, que sigue siendo el precio de lista del plan: un descuento
    // no debe reescribir el precio del plan para los demas miembros.
    string? PaymentStatus = null,
    decimal? PaymentAmount = null,
    string? PaymentMethod = null);
