@echo off
title ControlTV Build

echo.
echo ========================================
echo   ControlTV One-Click Build
echo ========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo [1/2] Building...
echo.

call node build.js

if %errorlevel% neq 0 (
    echo.
    echo [FAILED] Build error, check log above.
    pause
    exit /b 1
)

echo.
echo [2/2] Build done!
echo.
echo --- dist contents ---
dir /b dist\
echo.
echo ========================================
echo   Done! dist\ is your deploy package.
echo ========================================
echo.

pause
