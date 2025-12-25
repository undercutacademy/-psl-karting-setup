@echo off
echo ==========================================
echo   Stopping PSL Karting App Servers
echo ==========================================

echo Stopping processes on Port 3000 (Frontend) and 3001 (Backend)...

:: Use PowerShell to find processes on specific ports and kill them safely
PowerShell -Command "Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force; Write-Host 'Stopped Process ID:' $_ }"

echo.
echo All app servers have been stopped.
echo.
pause
