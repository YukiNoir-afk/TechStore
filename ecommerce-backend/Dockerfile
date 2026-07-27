# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY EcommerceApi/EcommerceApi.csproj EcommerceApi/
RUN dotnet restore EcommerceApi/EcommerceApi.csproj

COPY EcommerceApi/ EcommerceApi/
WORKDIR /src/EcommerceApi
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_gcServer=0
ENV DOTNET_TieredPGO=0
ENV DOTNET_TieredCompilation=0
ENV DOTNET_EnableHWIntrinsic=0
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
EXPOSE 8080

ENTRYPOINT ["dotnet", "EcommerceApi.dll"]
