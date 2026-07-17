namespace GymSaaS.Application.DTOs.Finance;

public sealed record MonthlyPointDto(string Month, decimal Revenue, decimal Expenses, int Users);
