@echo off
title NeuroAI - Frontend (Next.js Production)
color 0E
echo.
echo  ============================================================
echo     NeuroAI Frontend - Next.js (Production Mode)
echo     Will be available at: http://localhost:3000
echo  ============================================================
echo.

cd /d "%~dp0frontend"

npm run dev

:: Auto-install node_modules if missing
if not exist "node_modules" (
    echo  [!] node_modules not found. Running npm install first...
    echo      This will take a minute on first run.
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] npm install failed.
        echo          Make sure Node.js is installed: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependencies installed.
    echo.
)

:: Build production bundle
echo  [*] Building production bundle...
echo      This may take 1-2 minutes.
echo.
npm run build
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Production build failed.
    echo          Check the errors above and fix them.
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] Build complete. Starting production server...
echo.

:: Start production server
npm run start

echo.
echo  [Frontend stopped. Press any key to close.]
pause >nul

