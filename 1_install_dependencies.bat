@echo off
title NeuroAI - Install Dependencies
color 0B
echo.
echo ============================================================
echo    NeuroAI - Installing Python & Node.js Dependencies
echo ============================================================
echo.

:: 1. Install Python Backend Dependencies
echo [*] Installing Python backend dependencies...
cd /d "%~dp0"
if exist "requirements.txt" (
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install Python dependencies.
        echo         Make sure Python is installed and added to PATH.
        echo.
        pause
        exit /b 1
    )
    echo [OK] Python dependencies installed successfully.
) else (
    echo [!] requirements.txt not found in main directory.
)

echo.
echo ------------------------------------------------------------
echo.

:: 2. Install Node.js Frontend Dependencies
echo [*] Installing Node.js frontend dependencies...
cd /d "%~dp0frontend"
if exist "package.json" (
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install Node.js dependencies.
        echo         Make sure Node.js and npm are installed: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed successfully.
) else (
    echo [!] frontend/package.json not found.
)

echo.
echo ============================================================
echo  [SUCCESS] All backend & frontend dependencies installed!
echo  You can now launch the application scripts.
echo ============================================================
echo.
pause
