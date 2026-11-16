using FluentValidation;
using UniVibe.Application.DTOs.Message.Requests;

namespace UniVibe.Application.Validators.Event
{
    public sealed class SendMessageRequestValidator : AbstractValidator<SendMessageRequest>
    {
        public SendMessageRequestValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Mesaj içeriği boş olamaz.")
                .NotNull().WithMessage("Mesaj alanı zorunludur.")
                .MaximumLength(350).WithMessage("Bir mesaj en fazla 500 karakter olabilir.");
        }
    }
}