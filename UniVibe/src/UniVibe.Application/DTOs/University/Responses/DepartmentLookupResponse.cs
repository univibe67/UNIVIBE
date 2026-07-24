namespace UniVibe.Application.DTOs.University.Responses
{
    public class DepartmentLookupResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid FacultyId { get; set; }
    }
}
