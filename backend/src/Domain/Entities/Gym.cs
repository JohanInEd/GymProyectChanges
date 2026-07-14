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
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Plan> Plans { get; set; } = new List<Plan>();
    public ICollection<Member> Members { get; set; } = new List<Member>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
