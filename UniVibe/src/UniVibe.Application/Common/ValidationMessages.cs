namespace UniVibe.Application.Common
{
    public static class ValidationMessages
    {
        // Genel Messages
        public const string Required = "{PropertyName} alanı zorunludur.";
        public const string MinLength = "{PropertyName} en az {MinLength} karakter olmalıdır.";
        public const string MaxLength = "{PropertyName} en fazla {MaxLength} karakter olmalıdır.";
        public const string InvalidPhone = "Telefon numarası 5 ile başlamalı ve 10 haneli olmalıdır.";
        // RegisterCompleteValidator Messages
        public const string MissingToken = "Token bilgisi eksik.";
        public const string PasswordMinLength = "Şifre en az 8 karakter olmalıdır.";
        public const string PasswordRequiresUppercase = "Şifre en az bir büyük harf içermelidir.";
        public const string PasswordRequiresDigit = "Şifre en az bir rakam içermelidir.";
        public const string SelectDepartment = "Lütfen bir bölüm seçiniz.";
        public const string InvalidGrade = "Lütfen geçerli bir sınıf seviyesi seçiniz.";
        public const string InvalidUsernameFormat = "Kullanıcı adı sadece İngilizce harf, rakam ve alt çizgi (_) içerebilir, boşluk bırakılamaz.";
        // RegisterInitValidator Messages
        /*public const string MustBeEduTr = "Sadece .edu.tr uzantılı e-posta adresleri kabul edilir.";*/
    }
}
