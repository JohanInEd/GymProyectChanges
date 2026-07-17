namespace GymSaaS.Application.DTOs.Operations;

public sealed record BudgetDto(Guid Id, string Category, decimal MonthlyLimit, decimal Spent);

public sealed record SaveBudgetRequest(string Category, decimal MonthlyLimit);

public sealed record EquipmentDto(Guid Id, string Name, string? Category, string Status, DateOnly? NextMaintenance);

public sealed record SaveEquipmentRequest(Guid? Id, string Name, string? Category, string Status, DateOnly? NextMaintenance);

public sealed record UpdateEquipmentStatusRequest(string Status);

public sealed record ShiftDto(Guid Id, string Employee, string? Role, DateOnly Date, string StartTime, string EndTime, decimal Commission);

public sealed record CreateShiftRequest(string Employee, string? Role, DateOnly Date, string StartTime, string EndTime, decimal Commission);

public sealed record OperationsDataDto(
    IReadOnlyList<BudgetDto> Budgets,
    IReadOnlyList<EquipmentDto> Equipment,
    IReadOnlyList<ShiftDto> Shifts);
