using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Classes;
using GymSaaS.Domain.Entities;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/classes")]
[Authorize(Policy = "TenantStaff")]
public sealed class ClassesController : ControllerBase
{
    private const string Confirmed = "confirmed";
    private const string Cancelled = "cancelled";

    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;

    public ClassesController(GymSaaSDbContext dbContext, ITenantProvider tenantProvider)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
    }

    // ---- Templates (the catalog registered in Configuracion) ----

    [HttpGet("templates")]
    public async Task<ActionResult<IReadOnlyList<ClassTemplateDto>>> GetTemplates(CancellationToken cancellationToken)
    {
        var templates = await _dbContext.ClassTemplates
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .Select(t => new ClassTemplateDto(t.Id, t.Name, t.Coach, t.DurationMinutes, t.Capacity, t.Room))
            .ToListAsync(cancellationToken);

        return Ok(templates);
    }

    [HttpPost("templates")]
    public async Task<ActionResult<ClassTemplateDto>> SaveTemplate(SaveClassTemplateRequest request, CancellationToken cancellationToken)
    {
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("El nombre de la clase es obligatorio.");
        }

        ClassTemplate? template = null;
        if (request.Id is Guid id && id != Guid.Empty)
        {
            template = await _dbContext.ClassTemplates.SingleOrDefaultAsync(t => t.Id == id, cancellationToken);
        }

        template ??= await _dbContext.ClassTemplates.SingleOrDefaultAsync(t => t.Name == name, cancellationToken);

        if (template is null)
        {
            template = new ClassTemplate
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantProvider.CurrentTenantId,
                Name = name
            };
            _dbContext.ClassTemplates.Add(template);
        }

        template.Name = name;
        template.Coach = Clean(request.Coach);
        template.DurationMinutes = request.Duration;
        template.Capacity = request.Capacity;
        template.Room = Clean(request.Room);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new ClassTemplateDto(template.Id, template.Name, template.Coach, template.DurationMinutes, template.Capacity, template.Room));
    }

    [HttpDelete("templates/{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken cancellationToken)
    {
        var template = await _dbContext.ClassTemplates.SingleOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (template is null)
        {
            return NotFound();
        }

        _dbContext.ClassTemplates.Remove(template);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // ---- Scheduled classes + reservations ----

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GymClassDto>>> GetClasses(CancellationToken cancellationToken)
    {
        var classes = await _dbContext.GymClasses
            .AsNoTracking()
            .Include(c => c.Reservations)
                .ThenInclude(r => r.Member)
            .OrderByDescending(c => c.Date)
            .ToListAsync(cancellationToken);

        return Ok(classes.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<GymClassDto>> CreateClass(CreateClassRequest request, CancellationToken cancellationToken)
    {
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("El nombre de la clase es obligatorio.");
        }

        var tenantId = _tenantProvider.CurrentTenantId;

        // When a member is provided, validate before creating anything (mirrors the
        // frontend "Confirmar reserva" flow: no class is created if the member is invalid).
        Member? member = null;
        if (request.MemberId is Guid memberId && memberId != Guid.Empty)
        {
            member = await LoadMemberWithLatestSubscriptionAsync(memberId, cancellationToken);
            var validation = ValidateMemberForReservation(member);
            if (validation is not null)
            {
                return BadRequest(validation);
            }
        }

        var gymClass = new GymClass
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = name,
            Coach = Clean(request.Coach),
            Date = request.Date,
            Time = (request.Time ?? string.Empty).Trim(),
            DurationMinutes = request.Duration,
            Capacity = request.Capacity,
            Room = Clean(request.Room)
        };
        _dbContext.GymClasses.Add(gymClass);

        if (member is not null)
        {
            _dbContext.Reservations.Add(new Reservation
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                GymClassId = gymClass.Id,
                MemberId = member.Id,
                Status = Confirmed
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var created = await _dbContext.GymClasses
            .AsNoTracking()
            .Include(c => c.Reservations).ThenInclude(r => r.Member)
            .SingleAsync(c => c.Id == gymClass.Id, cancellationToken);

        return Ok(ToDto(created));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteClass(Guid id, CancellationToken cancellationToken)
    {
        var gymClass = await _dbContext.GymClasses.SingleOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (gymClass is null)
        {
            return NotFound();
        }

        _dbContext.GymClasses.Remove(gymClass); // reservations cascade
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("reservations")]
    public async Task<ActionResult<GymClassDto>> Reserve(CreateReservationRequest request, CancellationToken cancellationToken)
    {
        var gymClass = await _dbContext.GymClasses
            .Include(c => c.Reservations)
            .SingleOrDefaultAsync(c => c.Id == request.ClassId, cancellationToken);

        if (gymClass is null)
        {
            return NotFound("La clase no existe.");
        }

        var member = await LoadMemberWithLatestSubscriptionAsync(request.MemberId, cancellationToken);
        var validation = ValidateMemberForReservation(member);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var alreadyReserved = gymClass.Reservations
            .Any(r => r.MemberId == request.MemberId && r.Status == Confirmed);
        if (alreadyReserved)
        {
            return Conflict("El miembro ya tiene una reserva en esta clase.");
        }

        var confirmedCount = gymClass.Reservations.Count(r => r.Status == Confirmed);
        if (confirmedCount >= gymClass.Capacity)
        {
            return Conflict("La clase ya alcanzo su capacidad maxima.");
        }

        _dbContext.Reservations.Add(new Reservation
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantProvider.CurrentTenantId,
            GymClassId = gymClass.Id,
            MemberId = request.MemberId,
            Status = Confirmed
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        var updated = await _dbContext.GymClasses
            .AsNoTracking()
            .Include(c => c.Reservations).ThenInclude(r => r.Member)
            .SingleAsync(c => c.Id == gymClass.Id, cancellationToken);

        return Ok(ToDto(updated));
    }

    [HttpPost("reservations/{id:guid}/cancel")]
    public async Task<IActionResult> CancelReservation(Guid id, CancellationToken cancellationToken)
    {
        var reservation = await _dbContext.Reservations.SingleOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (reservation is null)
        {
            return NotFound();
        }

        reservation.Status = Cancelled;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<Member?> LoadMemberWithLatestSubscriptionAsync(Guid memberId, CancellationToken cancellationToken) =>
        await _dbContext.Members
            .Include(m => m.Subscriptions)
            .SingleOrDefaultAsync(m => m.Id == memberId && m.IsActive, cancellationToken);

    private static string? ValidateMemberForReservation(Member? member)
    {
        if (member is null)
        {
            return "El miembro no existe o esta inactivo.";
        }

        var subscription = member.Subscriptions
            .OrderByDescending(s => s.EndDate).ThenByDescending(s => s.CreatedAt)
            .FirstOrDefault();

        if (subscription is null)
        {
            return "El miembro no tiene una mensualidad registrada.";
        }

        if (subscription.Status == SubscriptionStatus.Suspended)
        {
            return "El miembro tiene la mensualidad suspendida.";
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (subscription.EndDate < today)
        {
            return "El miembro tiene la mensualidad vencida.";
        }

        return null;
    }

    private static GymClassDto ToDto(GymClass gymClass) =>
        new(
            gymClass.Id,
            gymClass.Name,
            gymClass.Coach,
            gymClass.Date,
            gymClass.Time,
            gymClass.DurationMinutes,
            gymClass.Capacity,
            gymClass.Room,
            gymClass.Reservations
                .OrderBy(r => r.CreatedAt)
                .Select(r => new ReservationDto(
                    r.Id,
                    r.GymClassId,
                    r.MemberId,
                    r.Member == null ? "Miembro" : r.Member.FirstName + " " + r.Member.LastName,
                    r.Status,
                    r.CreatedAt))
                .ToList());

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
