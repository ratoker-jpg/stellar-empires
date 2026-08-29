@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not exist "node_modules\.bin\vite.cmd" (
    echo Installing project dependencies...
    call npm ci
    if errorlevel 1 (
        echo Dependency installation failed.
        pause
        exit /b 1
    )
)

echo Starting Stellar Empires...
call npm run dev -- --open
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo The game server stopped with exit code %EXIT_CODE%.
)

pause
exit /b %EXIT_CODE%
