using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.InviteCodes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/invite-codes")]
[EnableRateLimiting("auth")]
public sealed class InviteCodesController : ControllerBase
{
    private readonly IInviteCodeService _inviteCodeService;

    public InviteCodesController(IInviteCodeService inviteCodeService)
    {
        _inviteCodeService = inviteCodeService;
    }

    [HttpPost("validate")]
    public async Task<ActionResult<ValidateInviteCodeResponse>> Validate(
        ValidateInviteCodeRequest request,
        CancellationToken cancellationToken)
    {
        var isValid = await _inviteCodeService.IsValidAsync(request.Code, cancellationToken);

        return Ok(new ValidateInviteCodeResponse(isValid));
    }

    [HttpPost("redeem")]
    public async Task<ActionResult<RedeemInviteCodeResponse>> Redeem(
        RedeemInviteCodeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _inviteCodeService.RedeemAsync(request.Code, cancellationToken);

        return Ok(new RedeemInviteCodeResponse(result.Success, result.Message));
    }
}
