using GymSaaS.Domain.Common;

namespace GymSaaS.Domain.Entities;

public sealed class Member : ITenantScoped
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public string? DocumentNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public string FullName => $"{FirstName} {LastName}".Trim();

    public Gym? Gym { get; set; }
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
