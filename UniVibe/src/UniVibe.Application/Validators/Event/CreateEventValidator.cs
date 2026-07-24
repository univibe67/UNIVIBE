using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;

namespace UniVibe.Application.Validators.Event
{
    public class CreateEventValidator : AbstractValidator<CreateEventRequest>
    {
        public CreateEventValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .MinimumLength(3).WithMessage(x => localizer["Val_MinLength"].Value)
                .MaximumLength(100).WithMessage(x => localizer["Val_MaxLength"].Value);

            RuleFor(x => x.EventDate)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .GreaterThan(DateTime.UtcNow).WithMessage(x => localizer["Val_EventDatePast"].Value);

            RuleFor(x => x.Location)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value);

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value);
        }
    }
}
