FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Projeleri UniVibe/src/ altındaki klasörlerden kopyalıyoruz
COPY ["UniVibe/src/UniVibe.API/UniVibe.API.csproj", "UniVibe.API/"]
COPY ["UniVibe/src/UniVibe.Application/UniVibe.Application.csproj", "UniVibe.Application/"]
COPY ["UniVibe/src/UniVibe.Infrastructure/UniVibe.Infrastructure.csproj", "UniVibe.Infrastructure/"]
COPY ["UniVibe/src/UniVibe.Domain/UniVibe.Domain.csproj", "UniVibe.Domain/"]

RUN dotnet restore "UniVibe.API/UniVibe.API.csproj"

# Tüm kodları kopyalayıp publish aşamasına geçiyoruz
COPY . .
WORKDIR "/src/UniVibe/src/UniVibe.API"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "UniVibe.API.dll"]