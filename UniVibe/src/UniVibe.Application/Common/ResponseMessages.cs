namespace UniVibe.Application.Common
{
    public static class ResponseMessages
    {
        public static class User
        {
            public const string AccountFrozen = "Hesabınız başarıyla donduruldu. 15 gün içinde giriş yaparak geri kurtarabilirsiniz.";
            public const string ProfileUpdated = "Profil bilgileri başarıyla güncellendi!";
            public const string Suspended = "Kullanıcı başarıyla askıya alındı.";
            public const string Activated = "Kullanıcının hesabı tekrar aktif edildi.";
            public const string Deleted = "Kullanıcı sistemden kalıcı olarak silindi.";
            public const string NotFound = "Kullanıcı bulunamadı.";
            public const string RoleChanged = "Kullanıcının rolü başarıyla değiştirildi.";
        }

        public static class Event
        {
            public const string Approved = "Etkinlik başarıyla onaylandı ve yayına alındı!";
            public const string Rejected = "Etkinlik başarıyla reddedildi!";
            public const string NotFound = "İlgili etkinlik bulunamadı.";
            public const string Created = "Etkinlik başarıyla oluşturuldu.";
            public const string Deleted = "Etkinlik başarıyla silindi.";
        }
        public static class Auth
        {
            public const string VerificationLinkSent = "Kayıt doğrulama linki mail adresine gönderildi.";
            public const string TokenInvalid = "Token geçersiz veya süresi dolmuş.";
            public const string TokenVerified = "Token doğrulandı.";
        }
    }
}
