namespace GymSaaS.Application.Abstractions;

public interface IInviteCodeService
{
    Task<bool> IsValidAsync(string code, CancellationToken cancellationToken);
    Task<InviteCodeRedeemResult> RedeemAsync(string code, CancellationToken cancellationToken);
}

public sealed record InviteCodeRedeemResult(bool Success, string? Message);
