using System.ComponentModel.DataAnnotations.Schema;

namespace UniVibe.Domain.Entities
{
    public sealed class Feedback : BaseEntity
    {
        public string Subject { get; set; } = string.Empty; // Örn: Şikayet, Öneri, Hata Bildirimi
        public string Message { get; set; } = string.Empty; 
        public bool IsResolved { get; set; } = false;      

        public Guid UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = default!;
    }
}
