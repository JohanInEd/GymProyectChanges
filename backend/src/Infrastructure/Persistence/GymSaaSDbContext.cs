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
    public DbSet<InviteCode> InviteCodes => Set<InviteCode>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ClassTemplate> ClassTemplates => Set<ClassTemplate>();
    public DbSet<GymClass> GymClasses => Set<GymClass>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<ProgressRecord> ProgressRecords => Set<ProgressRecord>();
    public DbSet<ProgressGoal> ProgressGoals => Set<ProgressGoal>();
    public DbSet<ProgressNote> ProgressNotes => Set<ProgressNote>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<UserToken> UserTokens => Set<UserToken>();
    public DbSet<SaasSubscription> SaasSubscriptions => Set<SaasSubscription>();
    public DbSet<SaasInvoice> SaasInvoices => Set<SaasInvoice>();

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
            entity.Property(x => x.City).HasMaxLength(120);
            entity.Property(x => x.SubscriptionPlan).HasMaxLength(60);
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
            entity.Property(x => x.Email).HasMaxLength(254);
            entity.Property(x => x.Phone).HasMaxLength(40);
            entity.Property(x => x.DocumentNumber).HasMaxLength(60);
            entity.Property(x => x.Gender).HasMaxLength(20);
            entity.Property(x => x.HeightCm).HasPrecision(6, 2);
            entity.Property(x => x.WeightKg).HasPrecision(6, 2);
            entity.Property(x => x.ChestCm).HasPrecision(6, 2);
            entity.Property(x => x.ArmCm).HasPrecision(6, 2);
            entity.Property(x => x.WaistCm).HasPrecision(6, 2);
            entity.Property(x => x.HipCm).HasPrecision(6, 2);
            entity.Property(x => x.LegCm).HasPrecision(6, 2);
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
                .HasFilter("\"AccessGranted\" = true AND \"CheckedOutAt\" IS NULL")
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

        modelBuilder.Entity<InviteCode>(entity =>
        {
            entity.ToTable("InviteCodes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(32).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(254).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(400).IsRequired();
            entity.Property(x => x.FullName).HasMaxLength(160).IsRequired();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasOne(x => x.Gym)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            // Intentionally no HasQueryFilter: login must resolve the tenant from the
            // email lookup itself, before any tenant context exists (same reasoning as InviteCode).
        });

        modelBuilder.Entity<Expense>(entity =>
        {
            entity.ToTable("Expenses");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Category).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(400);
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            entity.Property(x => x.PaymentMethod).HasMaxLength(60);
            entity.Property(x => x.Provider).HasMaxLength(160);
            entity.HasIndex(x => new { x.TenantId, x.ExpenseDate });
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Sku).HasMaxLength(60).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(80);
            entity.Property(x => x.Price).HasPrecision(18, 2);
            entity.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            entity.HasIndex(x => new { x.TenantId, x.Sku }).IsUnique();
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<ClassTemplate>(entity =>
        {
            entity.ToTable("ClassTemplates");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Coach).HasMaxLength(120);
            entity.Property(x => x.Room).HasMaxLength(120);
            entity.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<GymClass>(entity =>
        {
            entity.ToTable("GymClasses");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Coach).HasMaxLength(120);
            entity.Property(x => x.Time).HasMaxLength(10).IsRequired();
            entity.Property(x => x.Room).HasMaxLength(120);
            entity.HasIndex(x => new { x.TenantId, x.Date });
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.ToTable("Reservations");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
            entity.HasIndex(x => new { x.TenantId, x.GymClassId, x.MemberId });
            entity.HasOne(x => x.GymClass)
                .WithMany(x => x.Reservations)
                .HasForeignKey(x => x.GymClassId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Member)
                .WithMany()
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<ProgressRecord>(entity =>
        {
            entity.ToTable("ProgressRecords");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.WeightKg).HasPrecision(6, 2);
            entity.Property(x => x.ChestCm).HasPrecision(6, 2);
            entity.Property(x => x.WaistCm).HasPrecision(6, 2);
            entity.Property(x => x.HipCm).HasPrecision(6, 2);
            entity.Property(x => x.BodyFatPercentage).HasPrecision(5, 2);
            entity.Property(x => x.RecordedBy).HasMaxLength(160);
            entity.HasIndex(x => new { x.TenantId, x.MemberId, x.Date });
            entity.HasOne(x => x.Member)
                .WithMany()
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<ProgressGoal>(entity =>
        {
            entity.ToTable("ProgressGoals");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.TargetValue).HasPrecision(12, 2);
            entity.Property(x => x.Unit).HasMaxLength(40);
            entity.HasIndex(x => new { x.TenantId, x.MemberId });
            entity.HasOne(x => x.Member)
                .WithMany()
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<ProgressNote>(entity =>
        {
            entity.ToTable("ProgressNotes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Text).HasMaxLength(2000).IsRequired();
            entity.Property(x => x.Author).HasMaxLength(160);
            entity.HasIndex(x => new { x.TenantId, x.MemberId });
            entity.HasOne(x => x.Member)
                .WithMany()
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Budget>(entity =>
        {
            entity.ToTable("Budgets");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Category).HasMaxLength(80).IsRequired();
            entity.Property(x => x.MonthlyLimit).HasPrecision(18, 2);
            entity.HasIndex(x => new { x.TenantId, x.Category }).IsUnique();
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.ToTable("Equipment");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(80);
            entity.Property(x => x.Status).HasMaxLength(40).IsRequired();
            entity.HasIndex(x => new { x.TenantId });
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.ToTable("Shifts");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Employee).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Role).HasMaxLength(80);
            entity.Property(x => x.StartTime).HasMaxLength(10).IsRequired();
            entity.Property(x => x.EndTime).HasMaxLength(10).IsRequired();
            entity.Property(x => x.Commission).HasPrecision(18, 2);
            entity.HasIndex(x => new { x.TenantId, x.Date });
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<UserToken>(entity =>
        {
            entity.ToTable("UserTokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(x => x.TokenHash);
            entity.HasIndex(x => new { x.UserId, x.Purpose });
            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            // Intentionally no HasQueryFilter (same reasoning as User): resolved before tenant context exists.
        });

        modelBuilder.Entity<SaasSubscription>(entity =>
        {
            entity.ToTable("SaasSubscriptions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PlanType).HasMaxLength(60).IsRequired();
            entity.HasIndex(x => new { x.TenantId, x.EndDate });
            // Tenant-filtered: a gym can only ever read its own SaaS subscription.
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });

        modelBuilder.Entity<SaasInvoice>(entity =>
        {
            entity.ToTable("SaasInvoices");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            entity.Property(x => x.InvoiceUrl).HasMaxLength(500);
            entity.HasIndex(x => new { x.TenantId, x.IssuedAt });
            entity.HasQueryFilter(x => _tenantProvider == null || x.TenantId == _tenantProvider.CurrentTenantId);
        });
    }
}
