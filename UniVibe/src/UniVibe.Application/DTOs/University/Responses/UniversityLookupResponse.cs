namespace UniVibe.Application.DTOs.University.Responses
{
    public class UniversityLookupResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string EmailDomain { get; set; } = string.Empty;
    }
}
