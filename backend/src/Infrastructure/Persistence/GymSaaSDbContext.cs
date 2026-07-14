using GymSaaS.Application.Abstractions;
using GymSaaS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.Infrastructure.Persistence;

public sealed class GymSaaSDbContext : DbContext
{
    private readonly ITenantProvider? _tenantProvider;

    public GymSaaSDbContext(DbContextOptions<GymSaaSDbContext> options, ITenantProvider? tenantProvider = null)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Gym> Gyms => Set<Gym>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Attendance> Attendances => Set<Attendance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Gym>(entity =>
        {
            entity.ToTable("Gyms");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(254);
            entity.HasIndex(x => x.Slug).IsUnique();
        });

        modelBuilder.Entity<Plan>(entity =>
        {
            entity.ToTable("Plans");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            entity.Property(x => x.Price).HasPrecision(18, 2);
            entity.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
            entity.HasOne(x => x.Gym)
                .WithMany(x => x.Plans)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Member>(entity =>
        {
            entity.ToTable("Members");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FirstName).HasMaxLength(80).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(254).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(40);
            entity.Property(x => x.DocumentNumber).HasMaxLength(60);
            entity.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
            entity.HasOne(x => x.Gym)
                .WithMany(x => x.Members)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.ToTable("Subscriptions");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.TenantId, x.MemberId, x.Status });
            entity.HasOne(x => x.Member)
                .WithMany(x => x.Subscriptions)
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Plan)
                .WithMany(x => x.Subscriptions)
                .HasForeignKey(x => x.PlanId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            entity.Property(x => x.Provider).HasMaxLength(80);
            entity.Property(x => x.ProviderReference).HasMaxLength(160);
            entity.HasIndex(x => new { x.TenantId, x.Status, x.PaidAt });
            entity.HasOne(x => x.Member)
                .WithMany(x => x.Payments)
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Subscription)
                .WithMany(x => x.Payments)
                .HasForeignKey(x => x.SubscriptionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.ToTable("Attendances");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Reason).HasMaxLength(160).IsRequired();
            entity.Property(x => x.RecordedByUserId).HasMaxLength(120);
            entity.Property(x => x.CheckedOutByUserId).HasMaxLength(120);
            entity.HasIndex(x => new { x.TenantId, x.CheckedInAt });
            entity.HasIndex(x => new { x.TenantId, x.MemberId, x.CheckedInAt });
            entity.HasIndex(x => new { x.TenantId, x.MemberId })
                .HasFilter("[AccessGranted] = 1 AND [CheckedOutAt] IS NULL")
                .IsUnique();
            entity.HasOne(x => x.Gym)
                .WithMany(x => x.Attendances)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Member)
                .WithMany(x => x.Attendances)
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Subscription)
                .WithMany(x => x.Attendances)
                .HasForeignKey(x => x.SubscriptionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });
    }
}
