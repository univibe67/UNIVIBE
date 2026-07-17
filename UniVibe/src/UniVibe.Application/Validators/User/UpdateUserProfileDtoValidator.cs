using FluentValidation;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;

namespace UniVibe.Application.Validators.User
{
    public class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
    {
        public UpdateUserProfileRequestValidator()
        {
            RuleFor(x => x.Username)
                .MinimumLength(3).WithMessage(ValidationMessages.MinLength)
                .MaximumLength(20).WithMessage(ValidationMessages.MaxLength)
                .Matches("^[a-zA-Z0-9_]*$").WithMessage(ValidationMessages.InvalidUsernameFormat)
                .When(x => !string.IsNullOrWhiteSpace(x.Username));

            RuleFor(x => x.Bio)
                .MaximumLength(150).WithMessage(ValidationMessages.MaxLength)
                .When(x => !string.IsNullOrWhiteSpace(x.Bio));
        }
    }
}