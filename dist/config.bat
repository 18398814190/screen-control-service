@echo off
title Config - ControlTV

echo ========================================
echo   Device Configuration
echo ========================================
echo.

if exist "config.txt" (
    for /f "tokens=1,2 delims==" %%a in (config.txt) do (
        if "%%a"=="DEVICE_NAME" set DEVICE_NAME=%%b
        if "%%a"=="IP_ADDRESS" set IP_ADDRESS=%%b
        if "%%a"=="WS_PORT" set WS_PORT=%%b
        if "%%a"=="DEVICE_ID" set DEVICE_ID=%%b
    )
)

if not defined DEVICE_NAME set DEVICE_NAME=Display-1
if not defined IP_ADDRESS set IP_ADDRESS=
if not defined WS_PORT set WS_PORT=8080
if not defined DEVICE_ID set DEVICE_ID=

echo Current config:
echo   Device Name : %DEVICE_NAME%
echo   IP Address  : %IP_ADDRESS%
echo   WS Port     : %WS_PORT%
echo   Device ID   : %DEVICE_ID%
echo.

set /p DEVICE_NAME="Device Name (default: Display-1): "
set /p IP_ADDRESS="IP Address (leave empty=auto): "
set /p WS_PORT="Port (default: 8080): "
set /p DEVICE_ID="Device ID (leave empty=none): "

echo DEVICE_NAME=%DEVICE_NAME%> config.txt
echo IP_ADDRESS=%IP_ADDRESS%>> config.txt
echo WS_PORT=%WS_PORT%>> config.txt
echo DEVICE_ID=%DEVICE_ID%>> config.txt

echo.
echo Config saved!
pause
