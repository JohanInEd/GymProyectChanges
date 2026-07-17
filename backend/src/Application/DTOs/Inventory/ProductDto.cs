namespace GymSaaS.Application.DTOs.Inventory;

public sealed record ProductDto(
    Guid Id,
    string Sku,
    string Name,
    string? Category,
    decimal Price,
    int Stock,
    int MinimumStock);
