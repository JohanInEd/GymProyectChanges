# syntax=docker/dockerfile:1

##########################################################################
# GymSaaS API - multi-stage build for Coolify (Dockerfile build pack)
#
# Project layout (build context = ./backend):
#   src/API/GymSaaS.Api.csproj   -> entry point (ASP.NET Core Web API, net8.0)
#   src/Application/**/*.cs       -> pulled in by the csproj source globs
#   src/Domain/**/*.cs           -> pulled in by the csproj source globs
#   src/Infrastructure/**/*.cs    -> pulled in by the csproj source globs
#
# The API project has no <ProjectReference>; it compiles the sibling
# folders directly, so the whole src/ tree must be present at build time.
##########################################################################

########################################
# 1) Build + publish
########################################
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first so Docker can cache the NuGet layer.
# Only the csproj is needed to restore packages (the source globs resolve
# to nothing yet, which is fine for restore).
COPY src/API/GymSaaS.Api.csproj src/API/
RUN dotnet restore src/API/GymSaaS.Api.csproj

# Copy the rest of the backend source and publish a framework-dependent build.
COPY src/ src/
RUN dotnet publish src/API/GymSaaS.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

########################################
# 2) Runtime
########################################
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Kestrel must bind to all interfaces so Coolify's proxy can reach the app.
# Port 8080 is non-privileged, which lets us run as the non-root app user.
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=build /app/publish ./

# Run as the unprivileged user that ships with the .NET 8 image.
USER $APP_UID

EXPOSE 8080

ENTRYPOINT ["dotnet", "GymSaaS.Api.dll"]
