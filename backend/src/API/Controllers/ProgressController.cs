using System.Security.Claims;
using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Progress;
using GymSaaS.Domain.Entities;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/progress")]
[Authorize(Policy = "TenantStaff")]
public sealed class ProgressController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;

    public ProgressController(GymSaaSDbContext dbContext, ITenantProvider tenantProvider)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
    }

    private string CurrentUserName => User.FindFirst(ClaimTypes.Name)?.Value ?? "Sistema";

    [HttpGet]
    public async Task<ActionResult<ProgressDataDto>> GetAll([FromQuery] Guid? memberId, CancellationToken cancellationToken)
    {
        var records = await _dbContext.ProgressRecords
            .AsNoTracking()
            .Where(r => memberId == null || r.MemberId == memberId)
            .OrderBy(r => r.Date)
            .Select(r => new ProgressRecordDto(r.Id, r.MemberId, r.Date, r.WeightKg, r.ChestCm, r.WaistCm, r.HipCm, r.BodyFatPercentage, r.RecordedBy))
            .ToListAsync(cancellationToken);

        var goals = await _dbContext.ProgressGoals
            .AsNoTracking()
            .Where(g => memberId == null || g.MemberId == memberId)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new ProgressGoalDto(g.Id, g.MemberId, g.Title, g.TargetValue, g.Unit, g.TargetDate, g.Completed, g.CreatedAt))
            .ToListAsync(cancellationToken);

        var notes = await _dbContext.ProgressNotes
            .AsNoTracking()
            .Where(n => memberId == null || n.MemberId == memberId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new ProgressNoteDto(n.Id, n.MemberId, n.Text, n.Author, n.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new ProgressDataDto(records, goals, notes));
    }

    [HttpPost("records")]
    public async Task<ActionResult<ProgressRecordDto>> AddRecord(AddProgressRecordRequest request, CancellationToken cancellationToken)
    {
        var member = await _dbContext.Members.SingleOrDefaultAsync(m => m.Id == request.MemberId && m.IsActive, cancellationToken);
        if (member is null)
        {
            return NotFound("El miembro no existe.");
        }

        var record = new ProgressRecord
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantProvider.CurrentTenantId,
            MemberId = member.Id,
            Date = request.Date,
            WeightKg = request.WeightKg,
            ChestCm = request.ChestCm,
            WaistCm = request.WaistCm,
            HipCm = request.HipCm,
            BodyFatPercentage = request.BodyFatPercentage,
            RecordedBy = CurrentUserName
        };
        _dbContext.ProgressRecords.Add(record);

        // New measurements update the member's current body metrics.
        if (request.WeightKg.HasValue) member.WeightKg = request.WeightKg;
        if (request.ChestCm.HasValue) member.ChestCm = request.ChestCm;
        if (request.WaistCm.HasValue) member.WaistCm = request.WaistCm;
        if (request.HipCm.HasValue) member.HipCm = request.HipCm;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ProgressRecordDto(record.Id, record.MemberId, record.Date, record.WeightKg, record.ChestCm, record.WaistCm, record.HipCm, record.BodyFatPercentage, record.RecordedBy));
    }

    [HttpPost("goals")]
    public async Task<ActionResult<ProgressGoalDto>> AddGoal(AddProgressGoalRequest request, CancellationToken cancellationToken)
    {
        var title = (request.Title ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            return BadRequest("El titulo de la meta es obligatorio.");
        }

        var memberExists = await _dbContext.Members.AnyAsync(m => m.Id == request.MemberId && m.IsActive, cancellationToken);
        if (!memberExists)
        {
            return NotFound("El miembro no existe.");
        }

        var goal = new ProgressGoal
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantProvider.CurrentTenantId,
            MemberId = request.MemberId,
            Title = title,
            TargetValue = request.TargetValue,
            Unit = string.IsNullOrWhiteSpace(request.Unit) ? null : request.Unit.Trim(),
            TargetDate = request.TargetDate,
            Completed = false
        };
        _dbContext.ProgressGoals.Add(goal);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ProgressGoalDto(goal.Id, goal.MemberId, goal.Title, goal.TargetValue, goal.Unit, goal.TargetDate, goal.Completed, goal.CreatedAt));
    }

    [HttpPost("goals/{id:guid}/toggle")]
    public async Task<ActionResult<ProgressGoalDto>> ToggleGoal(Guid id, CancellationToken cancellationToken)
    {
        var goal = await _dbContext.ProgressGoals.SingleOrDefaultAsync(g => g.Id == id, cancellationToken);
        if (goal is null)
        {
            return NotFound();
        }

        goal.Completed = !goal.Completed;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ProgressGoalDto(goal.Id, goal.MemberId, goal.Title, goal.TargetValue, goal.Unit, goal.TargetDate, goal.Completed, goal.CreatedAt));
    }

    [HttpPost("notes")]
    public async Task<ActionResult<ProgressNoteDto>> AddNote(AddProgressNoteRequest request, CancellationToken cancellationToken)
    {
        var text = (request.Text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return BadRequest("La nota no puede estar vacia.");
        }

        var memberExists = await _dbContext.Members.AnyAsync(m => m.Id == request.MemberId && m.IsActive, cancellationToken);
        if (!memberExists)
        {
            return NotFound("El miembro no existe.");
        }

        var note = new ProgressNote
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantProvider.CurrentTenantId,
            MemberId = request.MemberId,
            Text = text,
            Author = CurrentUserName
        };
        _dbContext.ProgressNotes.Add(note);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ProgressNoteDto(note.Id, note.MemberId, note.Text, note.Author, note.CreatedAt));
    }
}
