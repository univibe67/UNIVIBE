using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniVibe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class IsBannedByAdminAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBannedByAdmin",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsBannedByAdmin",
                table: "Users");
        }
    }
}
