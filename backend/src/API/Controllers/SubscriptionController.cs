using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Subscriptions;
using GymSaaS.Application.Payments;
using GymSaaS.Domain.Entities;
using GymSaaS.Domain.Enums;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/subscriptions")]
public sealed class SubscriptionController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;
    private readonly IPaymentGateway _paymentGateway;

    public SubscriptionController(
        GymSaaSDbContext dbContext,
        ITenantProvider tenantProvider,
        IPaymentGateway paymentGateway)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
        _paymentGateway = paymentGateway;
    }

    [HttpPost("self-service/register-and-pay")]
    [AllowAnonymous]
    public async Task<ActionResult<RegisterAndPayResponse>> RegisterAndPay(
        RegisterAndPayRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.PaymentToken))
        {
            return BadRequest("Email and payment token are required.");
        }

        var gymExists = await _dbContext.Gyms
            .AsNoTracking()
            .AnyAsync(gym => gym.Id == request.TenantId && gym.IsActive, cancellationToken);

        if (!gymExists)
        {
            return NotFound("The selected gym does not exist or is inactive.");
        }

        var plan = await _dbContext.Plans
            .IgnoreQueryFilters()
            .AsNoTracking()
            .SingleOrDefaultAsync(
                plan => plan.Id == request.PlanId &&
                        plan.TenantId == request.TenantId &&
                        plan.IsActive,
                cancellationToken);

        if (plan is null)
        {
            return NotFound("The selected plan does not exist for this gym.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var duplicateEmail = await _dbContext.Members
            .IgnoreQueryFilters()
            .AnyAsync(
                member => member.TenantId == request.TenantId &&
                          member.Email == normalizedEmail,
                cancellationToken);

        if (duplicateEmail)
        {
            return Conflict("A member with this email already exists for the selected gym.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var member = new Member
        {
            Id = Guid.NewGuid(),
            TenantId = request.TenantId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            Phone = request.Phone?.Trim(),
            DocumentNumber = request.DocumentNumber?.Trim()
        };

        var startDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            TenantId = request.TenantId,
            MemberId = member.Id,
            PlanId = plan.Id,
            StartDate = startDate,
            EndDate = startDate.AddDays(plan.DurationDays),
            Status = SubscriptionStatus.PendingPayment
        };

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = request.TenantId,
            MemberId = member.Id,
            SubscriptionId = subscription.Id,
            Amount = plan.Price,
            Currency = plan.Currency,
            Provider = request.PaymentProvider.Trim(),
            Status = PaymentStatus.Pending
        };

        _dbContext.Members.Add(member);
        _dbContext.Subscriptions.Add(subscription);
        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var paymentResult = await _paymentGateway.ChargeAsync(
            new PaymentGatewayRequest(
                request.TenantId,
                member.Id,
                plan.Id,
                plan.Price,
                plan.Currency,
                request.PaymentProvider,
                request.PaymentToken),
            cancellationToken);

        if (paymentResult.IsApproved)
        {
            payment.Status = PaymentStatus.Paid;
            payment.PaidAt = DateTimeOffset.UtcNow;
            payment.ProviderReference = paymentResult.ProviderReference;
            subscription.Status = SubscriptionStatus.Active;
            subscription.ActivatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            payment.Status = PaymentStatus.Failed;
            payment.ProviderReference = paymentResult.ProviderReference;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(new RegisterAndPayResponse(
            member.Id,
            subscription.Id,
            payment.Id,
            subscription.Status,
            payment.Status,
            subscription.StartDate,
            subscription.EndDate));
    }

    [HttpPost("admin/members")]
    [Authorize(Policy = "TenantStaff")]
    public async Task<ActionResult<RegisterAndPayResponse>> CreateMemberManually(
        AdminCreateMemberRequest request,
        CancellationToken cancellationToken)
    {
        var tenantId = _tenantProvider.CurrentTenantId;
        var plan = await _dbContext.Plans
            .AsNoTracking()
            .SingleOrDefaultAsync(plan => plan.Id == request.PlanId && plan.IsActive, cancellationToken);

        if (plan is null)
        {
            return NotFound("The selected plan does not exist for this gym.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var duplicateEmail = await _dbContext.Members
            .AnyAsync(member => member.Email == normalizedEmail, cancellationToken);

        if (duplicateEmail)
        {
            return Conflict("A member with this email already exists for this gym.");
        }

        var startDate = request.StartDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var member = new Member
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            Phone = request.Phone?.Trim(),
            DocumentNumber = request.DocumentNumber?.Trim()
        };

        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            MemberId = member.Id,
            PlanId = plan.Id,
            StartDate = startDate,
            EndDate = startDate.AddDays(plan.DurationDays),
            Status = SubscriptionStatus.Active,
            ActivatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Members.Add(member);
        _dbContext.Subscriptions.Add(subscription);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = new RegisterAndPayResponse(
            member.Id,
            subscription.Id,
            Guid.Empty,
            subscription.Status,
            PaymentStatus.Pending,
            subscription.StartDate,
            subscription.EndDate);

        return Created($"/api/subscriptions/{subscription.Id}", response);
    }
}
