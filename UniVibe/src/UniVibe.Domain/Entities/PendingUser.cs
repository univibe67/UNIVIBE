namespace UniVibe.Domain.Entities
{
    public sealed class PendingUser : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public bool IsUsed { get; set; } = false;
    }
}
