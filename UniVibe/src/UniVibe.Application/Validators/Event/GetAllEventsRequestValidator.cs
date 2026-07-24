using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;

namespace UniVibe.Application.Validators.Event
{
    public class GetAllEventsRequestValidator : AbstractValidator<GetAllEventsRequest>
    {
        public GetAllEventsRequestValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.PageNumber)
                .GreaterThanOrEqualTo(1).WithMessage(x => localizer["Val_PageNumberMin"].Value);

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 50).WithMessage(x => localizer["Val_PageSizeRange"].Value);
        }
    }
}
