namespace UniVibe.Application.DTOs.University
{
    public class DepartmentLookupDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid FacultyId { get; set; }
    }
}
