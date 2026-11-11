using Microsoft.AspNetCore.Http;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.DTOs.Event.Requests
{
    public class CreateEventRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public IFormFile? ImageFile { get; set; }
        public GradeLevel? MinGrade { get; set; }
        public GradeLevel? MaxGrade { get; set; }
        public string? TargetDepartment { get; set; }
        public string? TargetFaculty { get; set; }
    }
}
