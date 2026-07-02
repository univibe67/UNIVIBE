using FluentValidation;
using UniVibe.Application.DTOs.User;

namespace UniVibe.Application.Validators.User
{
    public class UpdateUserProfileDtoValidator : AbstractValidator<UpdateUserProfileDto>
    {
        public UpdateUserProfileDtoValidator()
        {
            RuleFor(x => x.Username)
                .MinimumLength(3).WithMessage("Kullanıcı adı en az 3 karakter olmalıdır.")
                .MaximumLength(20).WithMessage("Kullanıcı adı en fazla 20 karakter olabilir.")
                .Matches("^[a-zA-Z0-9_]*$").WithMessage("Kullanıcı adı sadece İngilizce harf, rakam ve alt çizgi (_) içerebilir, boşluk bırakılamaz.")
                .When(x => !string.IsNullOrWhiteSpace(x.Username));

            RuleFor(x => x.Bio)
                .MaximumLength(150).WithMessage("Biyografi en fazla 150 karakter olabilir.")
                .When(x => !string.IsNullOrWhiteSpace(x.Bio));
        }
    }
}
