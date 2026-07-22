# Build aşaması
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Proje dosyalarını src klasörünün içinden kopyalıyoruz
COPY ["src/UniVibe.API/UniVibe.API.csproj", "UniVibe.API/"]
COPY ["src/UniVibe.Application/UniVibe.Application.csproj", "UniVibe.Application/"]
COPY ["src/UniVibe.Infrastructure/UniVibe.Infrastructure.csproj", "UniVibe.Infrastructure/"]
COPY ["src/UniVibe.Domain/UniVibe.Domain.csproj", "UniVibe.Domain/"]

RUN dotnet restore "UniVibe.API/UniVibe.API.csproj"

# Tüm kaynak kodunu kopyala
COPY . .
WORKDIR "/src/src/UniVibe.API"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime aşaması (Çalıştırma)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "UniVibe.API.dll"]