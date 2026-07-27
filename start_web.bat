@echo off
set "ROOT=%~dp0"
echo Starting Backend and Frontend...
start "Backend" /D "%ROOT%ecommerce-backend" cmd /k "title Backend API && dotnet run --project EcommerceApi\EcommerceApi.csproj"
start "Frontend" /D "%ROOT%ecommerce-frontend" cmd /k "title Frontend React && npm start"
echo Services started in separate windows!
echo Frontend is available at: http://localhost:3000
