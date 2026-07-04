using UniVibe.Domain.Common;

namespace UniVibe.Domain.Entities
{
    public class University : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string EmailDomain { get; set; } = string.Empty;

        public ICollection<Faculty> Faculties { get; set; } = new List<Faculty>();
    }
}
