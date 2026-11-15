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
                .NotEmpty().WithMessage(localizer["Val_CurrentPasswordRequired"].Value);

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage(localizer["Val_NewPasswordRequired"].Value)
                .MinimumLength(8).WithMessage(localizer["Val_PassMinLength"].Value)
                .Matches(@"[A-Z]").WithMessage(localizer["Val_PassUppercaseRequired"].Value)
                .Matches(@"[a-z]").WithMessage(localizer["Val_PassLowercaseRequired"].Value)
                .Matches(@"[0-9]").WithMessage(localizer["Val_PassDigitRequired"].Value);
        }
    }
}