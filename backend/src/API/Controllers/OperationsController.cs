using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Operations;
using GymSaaS.Domain.Entities;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/operations")]
[Authorize(Policy = "TenantStaff")]
public sealed class OperationsController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;

    public OperationsController(GymSaaSDbContext dbContext, ITenantProvider tenantProvider)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<OperationsDataDto>> GetAll(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var budgetEntities = await _dbContext.Budgets.AsNoTracking().OrderBy(b => b.Category).ToListAsync(cancellationToken);

        var monthExpensesByCategory = await _dbContext.Expenses
            .AsNoTracking()
            .Where(e => e.ExpenseDate.Year == today.Year && e.ExpenseDate.Month == today.Month)
            .GroupBy(e => e.Category)
            .Select(g => new { Category = g.Key, Spent = g.Sum(e => e.Amount) })
            .ToListAsync(cancellationToken);

        var budgets = budgetEntities
            .Select(b => new BudgetDto(
                b.Id,
                b.Category,
                b.MonthlyLimit,
                monthExpensesByCategory.FirstOrDefault(x => x.Category == b.Category)?.Spent ?? 0m))
            .ToList();

        var equipment = await _dbContext.Equipment
            .AsNoTracking()
            .OrderBy(e => e.Name)
            .Select(e => new EquipmentDto(e.Id, e.Name, e.Category, e.Status, e.NextMaintenance))
            .ToListAsync(cancellationToken);

        var shifts = await _dbContext.Shifts
            .AsNoTracking()
            .OrderByDescending(s => s.Date)
            .Select(s => new ShiftDto(s.Id, s.Employee, s.Role, s.Date, s.StartTime, s.EndTime, s.Commission))
            .ToListAsync(cancellationToken);

        return Ok(new OperationsDataDto(budgets, equipment, shifts));
    }

    [HttpPut("budgets")]
    public async Task<ActionResult<BudgetDto>> SaveBudget(SaveBudgetRequest request, CancellationToken cancellationToken)
    {
        var category = (request.Category ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(category))
        {
            return BadRequest("La categoria del presupuesto es obligatoria.");
        }

        var budget = await _dbContext.Budgets.SingleOrDefaultAsync(b => b.Category == category, cancellationToken);
        if (budget is null)
        {
            budget = new Budget
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantProvider.CurrentTenantId,
                Category = category
            };
            _dbContext.Budgets.Add(budget);
        }

        budget.MonthlyLimit = request.MonthlyLimit;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new BudgetDto(budget.Id, budget.Category, budget.MonthlyLimit, 0m));
    }

    [HttpPost("equipment")]
    public async Task<ActionResult<EquipmentDto>> SaveEquipment(SaveEquipmentRequest request, CancellationToken cancellationToken)
    {
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("El nombre del equipo es obligatorio.");
        }

        Equipment? equipment = null;
        if (request.Id is Guid id && id != Guid.Empty)
        {
            equipment = await _dbContext.Equipment.SingleOrDefaultAsync(e => e.Id == id, cancellationToken);
        }

        if (equipment is null)
        {
            equipment = new Equipment
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantProvider.CurrentTenantId,
                Name = name
            };
            _dbContext.Equipment.Add(equipment);
        }

        equipment.Name = name;
        equipment.Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();
        equipment.Status = string.IsNullOrWhiteSpace(request.Status) ? "Operativo" : request.Status.Trim();
        equipment.NextMaintenance = request.NextMaintenance;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new EquipmentDto(equipment.Id, equipment.Name, equipment.Category, equipment.Status, equipment.NextMaintenance));
    }

    [HttpPut("equipment/{id:guid}/status")]
    public async Task<ActionResult<EquipmentDto>> UpdateEquipmentStatus(Guid id, UpdateEquipmentStatusRequest request, CancellationToken cancellationToken)
    {
        var equipment = await _dbContext.Equipment.SingleOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (equipment is null)
        {
            return NotFound();
        }

        equipment.Status = string.IsNullOrWhiteSpace(request.Status) ? equipment.Status : request.Status.Trim();
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new EquipmentDto(equipment.Id, equipment.Name, equipment.Category, equipment.Status, equipment.NextMaintenance));
    }

    [HttpDelete("equipment/{id:guid}")]
    public async Task<IActionResult> DeleteEquipment(Guid id, CancellationToken cancellationToken)
    {
        var equipment = await _dbContext.Equipment.SingleOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (equipment is null)
        {
            return NotFound();
        }

        _dbContext.Equipment.Remove(equipment);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("shifts")]
    public async Task<ActionResult<ShiftDto>> CreateShift(CreateShiftRequest request, CancellationToken cancellationToken)
    {
        var employee = (request.Employee ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(employee))
        {
            return BadRequest("El nombre del empleado es obligatorio.");
        }

        var shift = new Shift
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantProvider.CurrentTenantId,
            Employee = employee,
            Role = string.IsNullOrWhiteSpace(request.Role) ? null : request.Role.Trim(),
            Date = request.Date,
            StartTime = (request.StartTime ?? string.Empty).Trim(),
            EndTime = (request.EndTime ?? string.Empty).Trim(),
            Commission = request.Commission
        };
        _dbContext.Shifts.Add(shift);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ShiftDto(shift.Id, shift.Employee, shift.Role, shift.Date, shift.StartTime, shift.EndTime, shift.Commission));
    }

    [HttpDelete("shifts/{id:guid}")]
    public async Task<IActionResult> DeleteShift(Guid id, CancellationToken cancellationToken)
    {
        var shift = await _dbContext.Shifts.SingleOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (shift is null)
        {
            return NotFound();
        }

        _dbContext.Shifts.Remove(shift);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
