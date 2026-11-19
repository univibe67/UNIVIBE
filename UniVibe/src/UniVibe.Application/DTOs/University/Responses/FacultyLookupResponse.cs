namespace UniVibe.Application.DTOs.University.Responses
{
    public class FacultyLookupResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? EmailSubDomain { get; set; } = string.Empty;
    }
}
