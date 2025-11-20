@echo off
echo ========================================
echo   FIVE NIGHTS AT KONDRAT'S - SERVER
echo ========================================
echo.
echo Запускаю локальный сервер...
echo.

cd /d "%~dp0"

python -m http.server 8080

pause
