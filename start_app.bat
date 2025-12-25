@echo off
echo ==========================================
echo   Starting PSL Karting App Servers
echo ==========================================

echo Starting Backend (Port 3001)...
start "PSL Backend" cmd /k "cd backend && npm run dev"

echo Starting Frontend (Port 3000)...
start "PSL Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servers are launching in new windows!
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:3001
echo.
echo You can minimize the server windows, but do not close them.
echo.
pause
