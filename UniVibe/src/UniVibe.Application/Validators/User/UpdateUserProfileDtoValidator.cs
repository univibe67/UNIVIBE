using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;

namespace UniVibe.Application.Validators.User
{
    public class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
    {
        public UpdateUserProfileRequestValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.Username)
                .MinimumLength(3).WithMessage(x => localizer["Val_MinLength"].Value)
                .MaximumLength(20).WithMessage(x => localizer["Val_MaxLength"].Value)
                .Matches("^[a-zA-Z0-9_]*$").WithMessage(x => localizer["Val_InvalidUsernameFormat"].Value)
                .When(x => !string.IsNullOrWhiteSpace(x.Username));

            RuleFor(x => x.Bio)
                .MaximumLength(150).WithMessage(x => localizer["Val_MaxLength"].Value)
                .When(x => !string.IsNullOrWhiteSpace(x.Bio));
        }
    }
}