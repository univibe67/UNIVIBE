using FluentValidation;
using UniVibe.Application.DTOs.Event.Requests;

public class CancelEventRequestValidator : AbstractValidator<CancelEventRequest>
{
    public CancelEventRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("İptal nedeni boş olamaz.")
            .MinimumLength(10).WithMessage("İptal nedeni en az 10 karakter olmalıdır.")
            .MaximumLength(250).WithMessage("İptal nedeni en fazla 250 karakter olabilir.");
    }
}