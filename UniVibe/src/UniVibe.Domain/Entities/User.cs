using UniVibe.Domain.Common;

namespace UniVibe.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty; // Kayıt ekranında şifre belirlerse
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        // Navigation Property: Bir öğrencinin oluşturduğu etkinliklerin listesi
        public virtual ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
