using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymSaaS.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeMemberEmailOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Members",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Members",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldNullable: true);
        }
    }
}
