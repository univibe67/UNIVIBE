FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Dockerfile ana dizinde olduğu için projeleri UniVibe klasörünün içinden alıyoruz
COPY ["UniVibe/UniVibe.API/UniVibe.API.csproj", "UniVibe.API/"]
COPY ["UniVibe/UniVibe.Application/UniVibe.Application.csproj", "UniVibe.Application/"]
COPY ["UniVibe/UniVibe.Infrastructure/UniVibe.Infrastructure.csproj", "UniVibe.Infrastructure/"]
COPY ["UniVibe/UniVibe.Domain/UniVibe.Domain.csproj", "UniVibe.Domain/"]

RUN dotnet restore "UniVibe.API/UniVibe.API.csproj"

COPY . .
WORKDIR "/src/UniVibe/UniVibe.API"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "UniVibe.API.dll"]