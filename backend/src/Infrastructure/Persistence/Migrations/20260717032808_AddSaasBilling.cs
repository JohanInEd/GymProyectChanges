using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymSaaS.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSaasBilling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SaasInvoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    IssuedAt = table.Column<DateOnly>(type: "date", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    InvoiceUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaasInvoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SaasInvoices_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SaasSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GymId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaasSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SaasSubscriptions_Gyms_GymId",
                        column: x => x.GymId,
                        principalTable: "Gyms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_SaasInvoices_GymId",
                table: "SaasInvoices",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_SaasInvoices_TenantId_IssuedAt",
                table: "SaasInvoices",
                columns: new[] { "TenantId", "IssuedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SaasSubscriptions_GymId",
                table: "SaasSubscriptions",
                column: "GymId");

            migrationBuilder.CreateIndex(
                name: "IX_SaasSubscriptions_TenantId_EndDate",
                table: "SaasSubscriptions",
                columns: new[] { "TenantId", "EndDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SaasInvoices");

            migrationBuilder.DropTable(
                name: "SaasSubscriptions");
        }
    }
}
