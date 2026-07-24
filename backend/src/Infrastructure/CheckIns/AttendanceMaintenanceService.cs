using GymSaaS.Application.Abstractions;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GymSaaS.Infrastructure.CheckIns;

/// <summary>
/// A visit with no recorded exit does not just look untidy: the filtered unique index on
/// Attendances ("AccessGranted" = true AND "CheckedOutAt" IS NULL) means the member cannot check in
/// again, and reception can only clear it while the visit is still visible in the recent log.
/// After that the member is locked out with no way to fix it from the UI.
/// <para>
/// Unlike subscription expiry, this cannot be solved by deriving state at read time: the index is
/// enforced by the database, so the row itself has to change. It is therefore written lazily, at
/// the moment attendance is read or a new entry is attempted, instead of by a background job.
/// </para>
/// </summary>
public sealed class AttendanceMaintenanceService : IAttendanceMaintenanceService
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly CheckInOptions _options;

    public AttendanceMaintenanceService(GymSaaSDbContext dbContext, IOptions<CheckInOptions> options)
    {
        _dbContext = dbContext;
        _options = options.Value;
    }

    public async Task<int> CloseStaleVisitsAsync(CancellationToken cancellationToken = default)
    {
        if (!_options.AutoCloseStaleVisits || _options.AutoCloseAfterHours <= 0)
        {
            return 0;
        }

        var hours = _options.AutoCloseAfterHours;
        var cutoff = DateTimeOffset.UtcNow.AddHours(-hours);

        // The tenant query filter applies to ExecuteUpdateAsync too, so this can only ever touch the
        // current gym's rows. CheckedOutAt is set to the moment the visit went stale, not to "now":
        // a sweep running three days later must not claim the person left three days later. It is a
        // cutoff, and AutoClosed is what says so.
        return await _dbContext.Attendances
            .Where(attendance =>
                attendance.AccessGranted &&
                attendance.CheckedOutAt == null &&
                attendance.CheckedInAt < cutoff)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(attendance => attendance.CheckedOutAt, attendance => attendance.CheckedInAt.AddHours(hours))
                    .SetProperty(attendance => attendance.AutoClosed, true),
                cancellationToken);
    }
}
