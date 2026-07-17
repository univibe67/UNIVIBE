using FluentValidation;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;

namespace UniVibe.Application.Validators.Event
{
    public class CreateEventValidator : AbstractValidator<CreateEventRequest>
    {
        public CreateEventValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage(ValidationMessages.Required)
                .MinimumLength(3).WithMessage(ValidationMessages.MinLength)
                .MaximumLength(100).WithMessage(ValidationMessages.MaxLength);

            RuleFor(x => x.EventDate)
                .NotEmpty().WithMessage(ValidationMessages.Required)
                .GreaterThan(DateTime.UtcNow).WithMessage(ValidationMessages.EventDatePast);

            RuleFor(x => x.Location)
                .NotEmpty().WithMessage(ValidationMessages.Required);

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage(ValidationMessages.Required);
        }
    }
}
