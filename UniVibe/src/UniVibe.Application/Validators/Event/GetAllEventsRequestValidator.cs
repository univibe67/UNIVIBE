using FluentValidation;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;

namespace UniVibe.Application.Validators.Event
{
    public class GetAllEventsRequestValidator : AbstractValidator<GetAllEventsRequest>
    {
        public GetAllEventsRequestValidator()
        {
            RuleFor(x => x.PageNumber)
                .GreaterThanOrEqualTo(1).WithMessage(ValidationMessages.PageNumberMin);

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 50).WithMessage(ValidationMessages.PageSizeRange);
        }
    }
}
