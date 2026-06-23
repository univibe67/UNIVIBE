using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniVibe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFilterFieldsToEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Faculty",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Grade",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<DateTime>(
                name: "EventDate",
                table: "Events",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinGrade",
                table: "Events",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetDepartment",
                table: "Events",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetFaculty",
                table: "Events",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Department",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Faculty",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MinGrade",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "TargetDepartment",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "TargetFaculty",
                table: "Events");

            migrationBuilder.AlterColumn<DateTime>(
                name: "EventDate",
                table: "Events",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");
        }
    }
}
