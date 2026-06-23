using FluentValidation;
using UniVibe.Application.DTOs.Event;

namespace UniVibe.Application.Validators.Event
{
    public class EventValidator : AbstractValidator<CreateEventRequest>
    {
        public EventValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Etkinlik başlığı boş olamaz.")
                .MaximumLength(100).WithMessage("Başlık en fazla 100 karakter olmalıdır.");

            RuleFor(x => x.Date)
                .GreaterThan(DateTime.UtcNow).WithMessage("Etkinlik tarihi geçmiş bir tarih olamaz.");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Açıklama gereklidir.");
        }
    }
}
