@echo off
set ROOT=%~dp0
cd /d "%ROOT%ecommerce-backend"
dotnet run --project .\EcommerceApi\EcommerceApi.csproj
