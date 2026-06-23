using FluentValidation;
using UniVibe.Application.DTOs.User;

namespace UniVibe.Application.Validators.User
{
    public class UserValidator : AbstractValidator<CreateUserDto>
    {
        public UserValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email zorunludur.")
                .EmailAddress().WithMessage("Geçerli bir e-posta adresi girin.")
                .Must(email => email.EndsWith(".edu.tr", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Sadece .edu.tr uzantılı e-posta adresleri kabul edilir.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Şifre boş olamaz.")
                .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalıdır.")
                .Matches(@"[A-Z]").WithMessage("En az bir büyük harf içermelidir.")
                .Matches(@"[0-9]").WithMessage("En az bir rakam içermelidir.");

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("İsim alanı gereklidir.");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Soyisim alanı gereklidir.");
        }
    }
}
