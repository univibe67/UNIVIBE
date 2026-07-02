using UniVibe.Domain.Common;

namespace UniVibe.Domain.Entities
{
    public class Faculty : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public ICollection<Department> Departments { get; set; } = new List<Department>();
    }
}
