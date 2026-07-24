namespace UniVibe.Domain.Entities
{
    public sealed class Department : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public Guid FacultyId { get; set; }
        public Faculty Faculty { get; set; } = null!;

        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
