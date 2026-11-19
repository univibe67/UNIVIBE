namespace UniVibe.Domain.Entities
{
    public sealed class AcademicDirectory : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public Guid UniversityId { get; set; }
        public University University { get; set; } = null!;
    }
}
