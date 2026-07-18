using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;

namespace UniVibe.Application.Validators.Auth
{
    public class RegisterCompleteValidator : AbstractValidator<RegisterCompleteRequest>
    {
        public RegisterCompleteValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.Token)
                .NotEmpty().WithMessage(x => localizer["Val_MissingToken"].Value);

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .MinimumLength(8).WithMessage(x => localizer["Val_PasswordMinLength"].Value)
                .Matches(@"[A-Z]").WithMessage(x => localizer["Val_PasswordReqUppercase"].Value)
                .Matches(@"[0-9]").WithMessage(x => localizer["Val_PasswordReqDigit"].Value);

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value);

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value);

            RuleFor(x => x.DepartmentId)
                .NotEmpty().WithMessage(x => localizer["Val_SelectDepartment"].Value);

            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .Matches(@"^5\d{9}$").WithMessage(x => localizer["Val_InvalidPhone"].Value);

            RuleFor(x => x.Grade)
                .IsInEnum().WithMessage(x => localizer["Val_InvalidGrade"].Value);

            RuleFor(x => x.Username)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .MinimumLength(3).WithMessage(x => localizer["Val_MinLength"].Value)
                .MaximumLength(20).WithMessage(x => localizer["Val_MaxLength"].Value)
                .Matches("^[a-zA-Z0-9_]*$").WithMessage(x => localizer["Val_InvalidUsernameFormat"].Value);
        }
    }
}