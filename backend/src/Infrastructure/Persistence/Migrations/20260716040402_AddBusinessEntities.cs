using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymSaaS.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxClasses",
                table: "Plans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Age",
                table: "Members",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ArmCm",
                table: "Members",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ChestCm",
                table: "Members",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Members",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HeightCm",
                table: "Members",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HipCm",
                table: "Members",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LegCm",
                table: "Members",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WaistCm",
                table: "Members",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WeightKg",
                table: "Members",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApprovalStatus",
                table: "Gyms",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "EmailVerified",
                table: "Gyms",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EmailVerifiedAt",
                table: "Gyms",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionPlan",
                table: "Gyms",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TrialEndsAt",
                table: "Gyms",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Budgets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    MonthlyLimit = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Budgets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Budgets_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ClassTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Coach = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Room = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassTemplates_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Equipment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    NextMaintenance = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Equipment_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    ExpenseDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    Provider = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Expenses_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GymClasses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Coach = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Time = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Room = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GymClasses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GymClasses_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Stock = table.Column<int>(type: "integer", nullable: false),
                    MinimumStock = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Products_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProgressGoals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TargetValue = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    Unit = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    TargetDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Completed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgressGoals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgressGoals_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProgressNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Author = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgressNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgressNotes_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProgressRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    WeightKg = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    ChestCm = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    WaistCm = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    HipCm = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    BodyFatPercentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    RecordedBy = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgressRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgressRecords_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Shifts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Employee = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Role = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    EndTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Commission = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Shifts_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Reservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    GymClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reservations_GymClasses_GymClassId",
                        column: x => x.GymClassId,
                        principalTable: "GymClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reservations_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_GymId",
                table: "Budgets",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_TenantId_Category",
                table: "Budgets",
                columns: new[] { "TenantId", "Category" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassTemplates_GymId",
                table: "ClassTemplates",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassTemplates_TenantId_Name",
                table: "ClassTemplates",
                columns: new[] { "TenantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_GymId",
                table: "Equipment",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_TenantId",
                table: "Equipment",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_GymId",
                table: "Expenses",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_TenantId_ExpenseDate",
                table: "Expenses",
                columns: new[] { "TenantId", "ExpenseDate" });

            migrationBuilder.CreateIndex(
                name: "IX_GymClasses_GymId",
                table: "GymClasses",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_GymClasses_TenantId_Date",
                table: "GymClasses",
                columns: new[] { "TenantId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_GymId",
                table: "Products",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_TenantId_Sku",
                table: "Products",
                columns: new[] { "TenantId", "Sku" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProgressGoals_MemberId",
                table: "ProgressGoals",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressGoals_TenantId_MemberId",
                table: "ProgressGoals",
                columns: new[] { "TenantId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProgressNotes_MemberId",
                table: "ProgressNotes",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressNotes_TenantId_MemberId",
                table: "ProgressNotes",
                columns: new[] { "TenantId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProgressRecords_MemberId",
                table: "ProgressRecords",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressRecords_TenantId_MemberId_Date",
                table: "ProgressRecords",
                columns: new[] { "TenantId", "MemberId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_GymClassId",
                table: "Reservations",
                column: "GymClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_MemberId",
                table: "Reservations",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_TenantId_GymClassId_MemberId",
                table: "Reservations",
                columns: new[] { "TenantId", "GymClassId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_GymId",
                table: "Shifts",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_TenantId_Date",
                table: "Shifts",
                columns: new[] { "TenantId", "Date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Budgets");

            migrationBuilder.DropTable(
                name: "ClassTemplates");

            migrationBuilder.DropTable(
                name: "Equipment");

            migrationBuilder.DropTable(
                name: "Expenses");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "ProgressGoals");

            migrationBuilder.DropTable(
                name: "ProgressNotes");

            migrationBuilder.DropTable(
                name: "ProgressRecords");

            migrationBuilder.DropTable(
                name: "Reservations");

            migrationBuilder.DropTable(
                name: "Shifts");

            migrationBuilder.DropTable(
                name: "GymClasses");

            migrationBuilder.DropColumn(
                name: "MaxClasses",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "Age",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "ArmCm",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "ChestCm",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "HeightCm",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "HipCm",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "LegCm",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "WaistCm",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "WeightKg",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "Gyms");

            migrationBuilder.DropColumn(
                name: "EmailVerified",
                table: "Gyms");

            migrationBuilder.DropColumn(
                name: "EmailVerifiedAt",
                table: "Gyms");

            migrationBuilder.DropColumn(
                name: "SubscriptionPlan",
                table: "Gyms");

            migrationBuilder.DropColumn(
                name: "TrialEndsAt",
                table: "Gyms");
        }
    }
}
