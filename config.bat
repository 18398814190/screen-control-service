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
    ) 
) 

if not defined DEVICE_NAME set DEVICE_NAME=Display-1 
if not defined IP_ADDRESS set IP_ADDRESS= 
if not defined WS_PORT set WS_PORT=8080 

Current config: 
  Device Name: %DEVICE_NAME% 
  IP Address: %IP_ADDRESS% 
  Port: %WS_PORT% 


set /p DEVICE_NAME="Device Name (default: Display-1): " 
set /p IP_ADDRESS="IP Address (leave empty=auto): " 
set /p WS_PORT="Port (default: 8080): " 


echo DEVICE_NAME=%DEVICE_NAME% > config.txt 
echo IP_ADDRESS=%IP_ADDRESS% >> config.txt 
echo WS_PORT=%WS_PORT% >> config.txt 

Config saved! 
pause 
