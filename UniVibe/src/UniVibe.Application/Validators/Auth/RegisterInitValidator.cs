using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;

namespace UniVibe.Application.Validators.Auth
{
    public class RegisterInitValidator : AbstractValidator<RegisterInitRequest>
    {
        public RegisterInitValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .EmailAddress().WithMessage(x => localizer["Val_InvalidEmail"].Value);
                /* BU KISIM CANLI TESTLERİNDE ACILICAK SAUNLIK KAPALI KALICAK
                .Must(email => email.EndsWith(".edu.tr", StringComparison.OrdinalIgnoreCase))
                .WithMessage(x => localizer["Val_InvalidEmailDomain"].Value);*/
        }
    }
}
