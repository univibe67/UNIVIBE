using Microsoft.Extensions.DependencyInjection;
using UniVibe.Application.Interfaces;
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

            return services;
        }
    }
}
