using FluentValidation;
using UniVibe.Application.DTOs.Event;

namespace UniVibe.Application.Validators.Event
{
    public class CreateEventValidator : AbstractValidator<CreateEventDto>
    {
        public CreateEventValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Başlık boş olamaz.")
                .MinimumLength(3).WithMessage("Başlık en az 3 karakter olmalı.");

            RuleFor(x => x.EventDate)
                .NotEmpty().WithMessage("Tarih girilmelidir.")
                .GreaterThan(DateTime.UtcNow).WithMessage("Geçmiş bir tarihe etkinlik oluşturamazsın.");

            RuleFor(x => x.Location)
                .NotEmpty().WithMessage("Lokasyon belirtilmelidir.");
        }
    }
}
