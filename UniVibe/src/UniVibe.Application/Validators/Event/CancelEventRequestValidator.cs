using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;

namespace UniVibe.Application.Validators.Event
{
    public class CancelEventRequestValidator : AbstractValidator<CancelEventRequest>
    {
        public CancelEventRequestValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage(localizer["Val_ReasonNotEmpty"].Value)
                .MinimumLength(10).WithMessage(localizer["Val_ReasonMinLength"].Value)
                .MaximumLength(250).WithMessage(localizer["Val_ReasonMaxLength"].Value);
        }
    }
}