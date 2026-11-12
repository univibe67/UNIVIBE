using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniVibe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexToEventAttendee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventAttendees_EventId",
                table: "EventAttendees");

            migrationBuilder.CreateIndex(
                name: "IX_EventAttendees_EventId_UserId",
                table: "EventAttendees",
                columns: new[] { "EventId", "UserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventAttendees_EventId_UserId",
                table: "EventAttendees");

            migrationBuilder.CreateIndex(
                name: "IX_EventAttendees_EventId",
                table: "EventAttendees",
                column: "EventId");
        }
    }
}
