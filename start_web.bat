@echo off
set ROOT=%~dp0
start "Backend" cmd /k "cd /d ""%ROOT%ecommerce-backend"" && dotnet run --project .\EcommerceApi\EcommerceApi.csproj"
start "Frontend" cmd /k "cd /d ""%ROOT%ecommerce-frontend"" && npm start"
echo Both services were started in separate windows.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
