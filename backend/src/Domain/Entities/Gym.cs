using GymSaaS.Domain.Enums;

namespace GymSaaS.Domain.Entities;

public sealed class Gym
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? LegalName { get; set; }
    public string? TaxId { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public bool IsActive { get; set; } = true;

    // SaaS tenant lifecycle (previously frontend-only mock bookkeeping).
    public string? SubscriptionPlan { get; set; }
    public GymApprovalStatus ApprovalStatus { get; set; } = GymApprovalStatus.Approved;
    public DateTimeOffset? TrialEndsAt { get; set; }
    public bool EmailVerified { get; set; }
    public DateTimeOffset? EmailVerifiedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Plan> Plans { get; set; } = new List<Plan>();
    public ICollection<Member> Members { get; set; } = new List<Member>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
