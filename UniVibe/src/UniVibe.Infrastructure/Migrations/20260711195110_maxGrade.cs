using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniVibe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class maxGrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxGrade",
                table: "Events",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxGrade",
                table: "Events");
        }
    }
}
