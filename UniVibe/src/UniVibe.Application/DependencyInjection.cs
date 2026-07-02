using Microsoft.Extensions.DependencyInjection;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Services;
using FluentValidation;
using UniVibe.Application.Validators.Auth;

namespace UniVibe.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Standart servislerimiz
            services.AddScoped<IEventService, EventService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUniversityService, UniversityService>();


            services.AddValidatorsFromAssemblyContaining<RegisterInitValidator>();

            return services;
        }
    }
}
