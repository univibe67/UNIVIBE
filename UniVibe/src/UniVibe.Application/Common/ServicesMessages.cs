namespace UniVibe.Application.Common
{
    public static class ServicesMessages
    {
        public static class EventMessages
        {
            public const string HasActiveEvent = "Aktif bir etkinliğin varken yeni bir tane oluşturamazsın.";
            public const string CategoryNotFound = "Seçilen kategori bulunamadı!";
            public const string EventNotFound = "Etkinlik bulunamadı.";
            public const string UnauthorizedDelete = "Bu etkinliği silmeye yetkiniz yok.";
            public const string CannotCancelPastEvent = "Başlamış veya geçmiş bir etkinlik iptal edilemez.";
            public const string CannotCancelTooClose = "Etkinliğe 4 saatten az bir süre kaldığı için iptal işlemi yapılamaz.";
            public const string UnauthorizedViewOrPending = "Bu etkinlik henüz onaylanmamış veya görüntüleme yetkiniz yok.";
        }

        public static class UserMessages
        {
            public const string UserNotFound = "Kullanıcı bulunamadı.";
            public const string UsernameTaken = "Bu kullanıcı adı zaten kullanılıyor, lütfen başka bir tane belirleyin.";
            public const string UsernameUpdateWaitTime = "Kullanıcı adınızı değiştirmek için {0} gün daha beklemelisiniz.";
        }
        public static class AuthMessages
        {
            // Login Mesajları
            public const string InvalidCredentials = "E-posta veya şifre hatalı.";
            public const string AccountDeletedTooLong = "Hesabınızı silmenizin üzerinden 15 günden fazla zaman geçmiş. Lütfen yeni bir hesap açın.";
            public const string AccountSuspended = "Hesabınız topluluk kurallarına uymadığınız için sistem yöneticileri tarafından askıya alınmıştır. İtiraz için lütfen destek ile iletişime geçin.";

            // Kayıt (Register) Başlatma Mesajları
            public const string EduMailRequired = "Sisteme sadece '.edu.tr' uzantili üniversite e-posta adresinizle kayit olabilirsiniz.";
            public const string EmailAlreadyActive = "Bu e-posta adresi ile zaten kayıtlı aktif bir kullanıcı bulunuyor.";
            public const string AccountInDeletionProcess = "Bu e-posta ile silinme sürecinde olan bir hesap var. Hesabınızı 'Giriş Yap' ekranından kurtarabilir veya tamamen silinmesi için {0} gün bekleyebilirsiniz.";
            public const string EmailSendFailed = "Mail gönderilemedi, lütfen bilgileri kontrol et. Hata: {0}";

            // Kayıt Tamamlama Mesajları
            public const string InvalidOrExpiredToken = "Geçersiz veya süresi dolmuş işlem.";
            public const string UniversityNotFound = "Sistemimizde '{0}' uzantısına tanımlı bir üniversite bulunmamaktadır.";
            public const string UsernameTaken = "Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.";
            public const string DepartmentNotFound = "Seçilen bölüm sistemde bulunamadı.";
            public const string FacultyMismatch = "Seçtiğiniz bölüm, e-posta adresinizin bağlı olduğu üniversiteye ait değil! Lütfen kendi üniversitenizin bölümlerinden birini seçin.";

            // Rol Bazlı Zorunluluk Mesajları
            public const string StudentGradeRequired = "Öğrenciler için sınıf (Grade) bilgisi zorunludur.";
            public const string TeacherTitleRequired = "Akademisyenler için ünvan (Title) bilgisi zorunludur.";

            // Refresh Token
            public const string SessionExpired = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapınız.";
        }
    }
}
