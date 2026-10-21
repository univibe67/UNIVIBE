using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Mappings;
using UniVibe.Application.Services;

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
            services.AddScoped<IAdminEventService, AdminEventService>();
            services.AddScoped<IAdminUserService, AdminUserService>();
            services.AddScoped<IFeedbackService, FeedbackService>();

            services.AddAutoMapper(cfg => { cfg.AddProfile<MappingProfile>(); });
            services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

            return services;
        }
    }
}
