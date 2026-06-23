using FluentValidation;
using UniVibe.Application.DTOs.Auth;

namespace UniVibe.Application.Validators.Auth
{
    public class RegisterInitValidator : AbstractValidator<RegisterInitRequest>
    {
        public RegisterInitValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email zorunludur.")
                .EmailAddress().WithMessage("Geçerli bir e-posta adresi girin.");
        }
    }
}
