using UniVibe.Domain.Common;

namespace UniVibe.Domain.Entities
{
    public class Faculty : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public Guid UniversityId { get; set; }
        public University University { get; set; } = null!;
        public ICollection<Department> Departments { get; set; } = new List<Department>();
    }
}
