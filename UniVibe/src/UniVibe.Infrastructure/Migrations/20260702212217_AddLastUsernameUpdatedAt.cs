using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniVibe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLastUsernameUpdatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastUsernameUpdatedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastUsernameUpdatedAt",
                table: "Users");
        }
    }
}
