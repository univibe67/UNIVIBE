using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Feedback.Request;

namespace UniVibe.Application.Validators.Feedback;

public class CreateFeedbackDtoValidator : AbstractValidator<CreateFeedbackDto>
{
    public CreateFeedbackDtoValidator(IStringLocalizer<SharedResources> localizer)
    {
        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
            .MinimumLength(3).WithMessage(x => localizer["Val_MinLength"].Value)
            .MaximumLength(100).WithMessage(x => localizer["Val_MaxLength"].Value)
            .When(x => !string.IsNullOrWhiteSpace(x.Subject));

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
            .MinimumLength(10).WithMessage(x => localizer["Val_MinLength"].Value)
            .MaximumLength(1000).WithMessage(x => localizer["Val_MaxLength"].Value)
            .When(x => !string.IsNullOrWhiteSpace(x.Message));
    }
}