using FluentValidation;
using UniVibe.Application.Constants;
using UniVibe.Application.DTOs.Auth;

namespace UniVibe.Application.Validators.Auth
{
    public class RegisterCompleteValidator : AbstractValidator<RegisterCompleteRequest>
    {
        public RegisterCompleteValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty().WithMessage("Token bilgisi eksik.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(ValidationMessages.Required)
                .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalıdır.")
                .Matches(@"[A-Z]").WithMessage("Şifre en az bir büyük harf içermelidir.")
                .Matches(@"[0-9]").WithMessage("Şifre en az bir rakam içermelidir.");

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage(ValidationMessages.Required);

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage(ValidationMessages.Required);

            RuleFor(x => x.Department)
                .NotEmpty().WithMessage(ValidationMessages.Required);

            RuleFor(x => x.Faculty)
                .NotEmpty().WithMessage(ValidationMessages.Required);

            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage(ValidationMessages.Required)
                .Matches(@"^5\d{9}$").WithMessage("Telefon 5 ile başlamalı ve 10 haneli olmalıdır.");

            RuleFor(x => x.Grade)
                .IsInEnum().WithMessage("Lütfen geçerli bir sınıf seviyesi seçiniz");
        }
    }
}
