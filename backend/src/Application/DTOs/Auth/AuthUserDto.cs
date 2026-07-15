namespace GymSaaS.Application.DTOs.Auth;

public sealed record AuthUserDto(Guid Id, Guid TenantId, string Name, string Email, string Role);
