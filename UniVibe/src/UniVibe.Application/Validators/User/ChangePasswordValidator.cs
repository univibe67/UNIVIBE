using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;

namespace UniVibe.Application.Validators.User
{
    public sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordRequest>
    {
        public ChangePasswordValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage(x => localizer["Val_CurrentPasswordRequired"].Value);

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage(x => localizer["Val_NewPasswordRequired"].Value)
                .MinimumLength(8).WithMessage(x => localizer["Val_PassMinLength"].Value)
                .Matches(@"[A-Z]").WithMessage(x => localizer["Val_PassUppercaseRequired"]?.Value ?? localizer["Val_PassUppercase"]?.Value ?? "Şifre en az bir büyük harf içermelidir.")
                .Matches(@"[a-z]").WithMessage(x => localizer["Val_PassLowercaseRequired"]?.Value ?? localizer["Val_PassLowercase"]?.Value ?? "Şifre en az bir küçük harf içermelidir.")
                .Matches(@"[0-9]").WithMessage(x => localizer["Val_PassDigitRequired"]?.Value ?? localizer["Val_PassDigit"]?.Value ?? "Şifre en az bir rakam içermelidir.");
        }
    }
}