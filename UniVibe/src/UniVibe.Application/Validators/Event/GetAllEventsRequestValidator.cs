using FluentValidation;
using UniVibe.Application.DTOs.Event.Requests;

namespace UniVibe.Application.Validators.Event
{
    public class GetAllEventsRequestValidator : AbstractValidator<GetAllEventsRequest>
    {
        public GetAllEventsRequestValidator()
        {
            RuleFor(x => x.PageNumber)
                .GreaterThanOrEqualTo(1).WithMessage("Sayfa numarası en az 1 olmalı.");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 50).WithMessage("Sayfa boyutu 1 ile 50 arasında olmalı.");
        }
    }
}
