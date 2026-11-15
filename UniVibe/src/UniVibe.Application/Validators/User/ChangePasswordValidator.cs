using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;

public sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordValidator(IStringLocalizer<SharedResources> localizer)
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage(localizer["Val_CurrentPasswordRequired"].Value);

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage(localizer["Val_NewPasswordRequired"].Value)
            .MinimumLength(8).WithMessage(localizer["Val_PassMinLength"].Value);
    }
}