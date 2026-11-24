using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;

namespace UniVibe.Application.Validators.User
{
    public sealed class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
    {
        public UpdateUserProfileRequestValidator(IStringLocalizer<SharedResources> localizer)
        {
            RuleFor(x => x.Username)
                .MinimumLength(3).WithMessage(x => localizer["Val_MinLength"].Value)
                .MaximumLength(20).WithMessage(x => localizer["Val_MaxLength"].Value)
                .Matches("^[a-zA-Z0-9_]*$").WithMessage(x => localizer["Val_InvalidUsernameFormat"].Value)
                .When(x => !string.IsNullOrWhiteSpace(x.Username));

            RuleFor(x => x.Bio)
                .MaximumLength(150).WithMessage(x => localizer["Val_MaxLength"].Value)
                .When(x => !string.IsNullOrWhiteSpace(x.Bio));

            RuleFor(x => x.SocialMediaLink)
                .MaximumLength(150)
                    .WithMessage(x => localizer["Val_MaxLength"]?.Value ?? "Sosyal medya bilgisi en fazla 150 karakter olabilir.")
                .Must(BeSafeSocialMediaValue)
                    .WithMessage(x => localizer["Val_InvalidSocialMedia"]?.Value ?? "Geçersiz veya güvensiz karakterler içeriyor.")
                .When(x => !string.IsNullOrWhiteSpace(x.SocialMediaLink));
        }

        private static bool BeSafeSocialMediaValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return true;

            var trimmed = value.Trim();

            if (trimmed.Contains('<') || trimmed.Contains('>'))
                return false;

            if (trimmed.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("data:", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("vbscript:", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return true;
        }
    }
}