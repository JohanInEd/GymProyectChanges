namespace GymSaaS.Application.DTOs.Finance;

/// <summary>
/// Un mes de la historia completa del gimnasio. A diferencia de <see cref="MonthlyPointDto"/>,
/// que es siempre la ventana movil de 6 meses, esta serie llega hasta el primer movimiento
/// registrado para que el panel pueda filtrar por año.
/// </summary>
public sealed record MonthlyHistoryPointDto(
    int Year,
    int Month,
    string MonthLabel,
    decimal Revenue,
    decimal Expenses,
    int Users);
