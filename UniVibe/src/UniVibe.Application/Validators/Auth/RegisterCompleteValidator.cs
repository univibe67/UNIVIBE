using FluentValidation;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;

namespace UniVibe.Application.Validators.Auth
{
    public class RegisterCompleteValidator : AbstractValidator<RegisterCompleteRequest>
    {
        public RegisterCompleteValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty().WithMessage(ValidationMessages.MissingToken);

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(ValidationMessages.Required)
                .MinimumLength(8).WithMessage(ValidationMessages.PasswordMinLength)
                .Matches(@"[A-Z]").WithMessage(ValidationMessages.PasswordRequiresUppercase)
                .Matches(@"[0-9]").WithMessage(ValidationMessages.PasswordRequiresDigit);

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage(ValidationMessages.Required);

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage(ValidationMessages.Required);
            RuleFor(x => x.DepartmentId)
                .NotEmpty().WithMessage(ValidationMessages.SelectDepartment);

            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage(ValidationMessages.Required)
                .Matches(@"^5\d{9}$").WithMessage(ValidationMessages.InvalidPhone);

            RuleFor(x => x.Grade)
                .IsInEnum().WithMessage(ValidationMessages.InvalidGrade);
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage(ValidationMessages.Required)
                .MinimumLength(3).WithMessage(ValidationMessages.MinLength)
                .MaximumLength(20).WithMessage(ValidationMessages.MaxLength)
                .Matches("^[a-zA-Z0-9_]*$").WithMessage(ValidationMessages.InvalidUsernameFormat);
        }
    }
}
