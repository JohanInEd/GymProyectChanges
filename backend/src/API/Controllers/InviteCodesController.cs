using GymSaaS.Application.DTOs.InviteCodes;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/invite-codes")]
public sealed class InviteCodesController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;

    public InviteCodesController(GymSaaSDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost("validate")]
    public async Task<ActionResult<ValidateInviteCodeResponse>> Validate(
        ValidateInviteCodeRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedCode = NormalizeCode(request.Code);

        var isValid = await _dbContext.InviteCodes
            .AsNoTracking()
            .AnyAsync(code => code.Code == normalizedCode && !code.IsUsed, cancellationToken);

        return Ok(new ValidateInviteCodeResponse(isValid));
    }

    [HttpPost("redeem")]
    public async Task<ActionResult<RedeemInviteCodeResponse>> Redeem(
        RedeemInviteCodeRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedCode = NormalizeCode(request.Code);

        var updatedRows = await _dbContext.InviteCodes
            .Where(code => code.Code == normalizedCode && !code.IsUsed)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(code => code.IsUsed, true)
                    .SetProperty(code => code.UsedAt, DateTimeOffset.UtcNow),
                cancellationToken);

        if (updatedRows == 0)
        {
            return Ok(new RedeemInviteCodeResponse(false, "El codigo no es valido o ya fue utilizado."));
        }

        return Ok(new RedeemInviteCodeResponse(true, null));
    }

    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();
}
