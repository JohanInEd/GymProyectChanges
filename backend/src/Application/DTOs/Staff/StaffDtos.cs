namespace GymSaaS.Application.DTOs.Staff;

public sealed record StaffUserDto(Guid Id, string Name, string Email, string Role, bool Active);

public sealed record CreateStaffRequest(string Name, string Email, string Role, string Password);
