# Build aşaması
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Proje dosyalarını kopyala ve restore et
COPY ["UniVibe.API/UniVibe.API.csproj", "UniVibe.API/"]
COPY ["UniVibe.Application/UniVibe.Application.csproj", "UniVibe.Application/"]
COPY ["UniVibe.Infrastructure/UniVibe.Infrastructure.csproj", "UniVibe.Infrastructure/"]
COPY ["UniVibe.Domain/UniVibe.Domain.csproj", "UniVibe.Domain/"]

RUN dotnet restore "UniVibe.API/UniVibe.API.csproj"

# Tüm kaynak kodunu kopyala ve publish et
COPY . .
WORKDIR "/src/UniVibe.API"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime aşaması (Çalıştırma)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render'ın dinamik olarak atayacağı Port'u yakalaması için gerekli ayar
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "UniVibe.API.dll"]