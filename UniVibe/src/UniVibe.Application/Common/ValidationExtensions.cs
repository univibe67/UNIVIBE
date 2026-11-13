using FluentValidation;
using UniVibe.Application.Exceptions;

namespace UniVibe.Application.Common
{
    public static class ValidationExtensions
    {
        public static async Task ValidateAndThrowCustomAsync<T>(this IValidator<T> validator, T instance)
        {
            var validationResult = await validator.ValidateAsync(instance);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException(string.Join(" • ", errors));
            }
        }
    }
}
