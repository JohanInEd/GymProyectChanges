namespace GymSaaS.Application.Abstractions;

/// <summary>
/// Closes visits that were never checked out. Called from the check-in endpoints rather than from a
/// scheduled job — this application has no scheduler, and the work is only ever needed at the moment
/// somebody looks at or acts on attendance.
/// </summary>
public interface IAttendanceMaintenanceService
{
    /// <summary>
    /// Closes every stale open visit of the current tenant and returns how many were closed.
    /// </summary>
    Task<int> CloseStaleVisitsAsync(CancellationToken cancellationToken = default);
}
