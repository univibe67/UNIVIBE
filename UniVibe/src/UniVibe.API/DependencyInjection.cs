using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Localization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using UniVibe.Application.Common;

namespace UniVibe.API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddWebAPIServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddControllers();
            services.AddSignalR();
            services.AddHttpContextAccessor();

            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });

            services.AddRateLimiter(options =>
            {
                options.AddPolicy("LoginLimit", context =>
                {
                    var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    var email = TryExtractEmailFromRequest(context.Request);

                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        return RateLimitPartition.GetFixedWindowLimiter($"login:{ip}:{email}", _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 8,
                            Window = TimeSpan.FromMinutes(15),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        });
                    }

                    return RateLimitPartition.GetFixedWindowLimiter($"login-ip:{ip}", _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 200,
                        Window = TimeSpan.FromMinutes(15),
                        QueueLimit = 0,
                        AutoReplenishment = true
                    });
                });

                options.AddPolicy("StrictAuthLimit", context =>
                {
                    var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                    return RateLimitPartition.GetFixedWindowLimiter($"strict:{ip}", _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 60,
                        Window = TimeSpan.FromMinutes(15),
                        QueueLimit = 0,
                        AutoReplenishment = true
                    });
                });

                options.OnRejected = async (context, token) =>
                {
                    var localizationService = context.HttpContext.RequestServices.GetRequiredService<IStringLocalizer<SharedResources>>();

                    var message = localizationService["Res_RateLimit_TooManyRequests"].Value;

                    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    context.HttpContext.Response.ContentType = "application/json";

                    var responseObj = ApiResponse<object>.Fail(message);

                    var jsonResponse = JsonSerializer.Serialize(responseObj);

                    await context.HttpContext.Response.WriteAsync(jsonResponse, token);
                };
            });

            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder
                        .WithOrigins(
                            "https://univibe-three.vercel.app",
                            "https://univibe-git-main-univibe67s-projects.vercel.app",
                            "http://localhost:3000"
                        )
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

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

            services.AddMemoryCache();

            services.AddLocalization();

            services.Configure<RequestLocalizationOptions>(options =>
            {
                var supportedCultures = new[] { "tr-TR", "en-US" };
                options.SetDefaultCulture("tr-TR")
                       .AddSupportedCultures(supportedCultures)
                       .AddSupportedUICultures(supportedCultures);
            });

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"] ?? "UniVibe",
                    ValidAudience = configuration["Jwt:Audience"] ?? "UniVibeUsers",
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)),
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.StartsWithSegments("/hubs", StringComparison.OrdinalIgnoreCase))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "UniVibe API", Version = "v1" });

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "JWT Token'ınızı buraya yapıştırın. (Sadece token'ı yazın, başına 'Bearer ' eklemenize gerek yok!)"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            return services;
        }

        private static string? TryExtractEmailFromRequest(HttpRequest request)
        {
            if (!string.IsNullOrWhiteSpace(request.Query["email"]))
            {
                return request.Query["email"].ToString().Trim().ToLowerInvariant();
            }

            if (request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) != true)
                return null;

            if (request.ContentLength.HasValue && request.ContentLength.Value > 16_384)
                return null;

            try
            {
                request.EnableBuffering();
                if (request.Body.CanSeek)
                {
                    request.Body.Position = 0;
                }

                using var ms = new MemoryStream();
                request.Body.CopyToAsync(ms).GetAwaiter().GetResult();

                if (request.Body.CanSeek)
                {
                    request.Body.Position = 0;
                }

                if (ms.Length == 0)
                    return null;

                using var doc = JsonDocument.Parse(ms.ToArray());
                if (doc.RootElement.ValueKind == JsonValueKind.Object)
                {
                    var emailProp = doc.RootElement.EnumerateObject()
                        .FirstOrDefault(p => string.Equals(p.Name, "email", StringComparison.OrdinalIgnoreCase));

                    if (emailProp.Name != null && emailProp.Value.ValueKind == JsonValueKind.String)
                    {
                        var value = emailProp.Value.GetString()?.Trim().ToLowerInvariant();
                        return string.IsNullOrWhiteSpace(value) ? null : value;
                    }
                }
            }
            catch (JsonException)
            {
                return null;
            }
            catch (IOException)
            {
                return null;
            }

            return null;
        }
    }
}