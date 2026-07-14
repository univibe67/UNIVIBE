using Microsoft.Extensions.DependencyInjection;
using Serilog;

namespace UniVibe.Infrastructure.Extensions
{
    public static class SerilogExtensions
    {
        public static void AddUniVibeSerilog(this IServiceCollection services)
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .Enrich.FromLogContext()
                .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day,retainedFileCountLimit:7)
                .CreateLogger();
        }
    }
}
