using FluentValidation;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth;

namespace UniVibe.Application.Validators.Auth
{
    public class RegisterInitValidator : AbstractValidator<RegisterInitRequest>
    {
        public RegisterInitValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(ValidationMessages.Required)
                .EmailAddress().WithMessage("Geçerli bir e-posta adresi girin.");
                /* BU KISIM CANLI TESTLERİNDE ACILICAK SAUNLIK KAPALI KALICAK
                .Must(email => email.EndsWith(".edu.tr", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Sadece .edu.tr uzantılı e-posta adresleri ile kayıt olabilirsiniz.");*/
        }
    }
}
