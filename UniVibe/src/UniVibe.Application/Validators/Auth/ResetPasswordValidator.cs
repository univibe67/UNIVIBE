using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;

namespace UniVibe.Application.Validators.Auth
{
    public class ResetPasswordValidator : AbstractValidator<ResetPasswordRequest>
    {
        public ResetPasswordValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .EmailAddress().WithMessage(x => localizer["Val_InvalidEmail"].Value);

            RuleFor(x => x.Token)
                .NotEmpty().WithMessage(x => localizer["Val_MissingToken"].Value);

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .MinimumLength(8).WithMessage(x => localizer["Val_PasswordMinLength"].Value)
                .Matches(@"[A-Z]").WithMessage(x => localizer["Val_PasswordReqUppercase"].Value)
                .Matches(@"[0-9]").WithMessage(x => localizer["Val_PasswordReqDigit"].Value);
        }
    }
}
