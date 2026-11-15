namespace UniVibe.Domain.Entities
{
    public sealed class University : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string AcademicEmailDomain { get; set; } = string.Empty;
        public string StudentEmailDomain { get; set; } = string.Empty;

        public ICollection<Faculty> Faculties { get; set; } = new List<Faculty>();
    }
}
