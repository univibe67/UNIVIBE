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
                .GreaterThan(_ => DateTime.UtcNow).WithMessage(x => localizer["Val_EventDatePast"].Value);

            RuleFor(x => x.Location)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value);

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value);

            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value);

            RuleFor(x => x.Capacity)
                .NotEmpty().WithMessage(x => localizer["Val_Required"].Value)
                .GreaterThan(0).WithMessage(x => localizer["Val_CapacityGreaterThanZero"]?.Value ?? "Kontenjan en az 1 olmalıdır.")
                .LessThanOrEqualTo(50000).WithMessage(x => localizer["Val_CapacityMax50000"]?.Value ?? "Kontenjan en fazla 50.000 olabilir.");

            RuleFor(x => x.MinGrade)
                .IsInEnum()
                .When(x => x.MinGrade.HasValue)
                .WithMessage(x => localizer["Val_InvalidGrade"]?.Value ?? "Geçersiz minimum sınıf seviyesi.");

            RuleFor(x => x.MaxGrade)
                .IsInEnum()
                .When(x => x.MaxGrade.HasValue)
                .WithMessage(x => localizer["Val_InvalidGrade"]?.Value ?? "Geçersiz maksimum sınıf seviyesi.");

            RuleFor(x => (int)x.MinGrade!.Value)
                .LessThanOrEqualTo(x => (int)x.MaxGrade!.Value)
                .When(x => x.MinGrade.HasValue && x.MaxGrade.HasValue)
                .WithMessage(x => localizer["Val_GradeRangeInvalid"]?.Value ?? "Minimum sınıf seviyesi, maksimum sınıf seviyesinden büyük olamaz.");
        }
    }
}