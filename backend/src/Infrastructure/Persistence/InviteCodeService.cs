using GymSaaS.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.Infrastructure.Persistence;

public sealed class InviteCodeService : IInviteCodeService
{
    private readonly GymSaaSDbContext _dbContext;

    public InviteCodeService(GymSaaSDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> IsValidAsync(string code, CancellationToken cancellationToken)
    {
        var normalizedCode = Normalize(code);

        return await _dbContext.InviteCodes
            .AsNoTracking()
            .AnyAsync(invite => invite.Code == normalizedCode && !invite.IsUsed, cancellationToken);
    }

    public async Task<InviteCodeRedeemResult> RedeemAsync(string code, CancellationToken cancellationToken)
    {
        var normalizedCode = Normalize(code);

        var updatedRows = await _dbContext.InviteCodes
            .Where(invite => invite.Code == normalizedCode && !invite.IsUsed)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(invite => invite.IsUsed, true)
                    .SetProperty(invite => invite.UsedAt, DateTimeOffset.UtcNow),
                cancellationToken);

        return updatedRows == 0
            ? new InviteCodeRedeemResult(false, "El codigo no es valido o ya fue utilizado.")
            : new InviteCodeRedeemResult(true, null);
    }

    private static string Normalize(string code) => code.Trim().ToUpperInvariant();
}
