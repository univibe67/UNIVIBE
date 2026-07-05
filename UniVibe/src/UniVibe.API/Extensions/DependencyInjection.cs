using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;

namespace UniVibe.API.Extensions
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddWebAPIServices(this IServiceCollection services)
        {
            services.AddControllers();
            services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return new BadRequestObjectResult(ApiResponse<object>.Fail(errors));
                };
            });

            return services;
        }
    }
}
