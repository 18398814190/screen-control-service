@echo off 
title ControlTV Service 

if exist "config.txt" ( 
    for /f "tokens=1,2 delims==" %%a in (config.txt) do ( 
        if "%%a"=="DEVICE_NAME" set DEVICE_NAME=%%b 
        if "%%a"=="IP_ADDRESS" set IP_ADDRESS=%%b 
        if "%%a"=="WS_PORT" set WS_PORT=%%b 
    ) 
) 

if not defined DEVICE_NAME set DEVICE_NAME=Display-1 
if not defined WS_PORT set WS_PORT=8080 

set CMD=ControlTV.exe --name %DEVICE_NAME% 
if defined IP_ADDRESS if not "%IP_ADDRESS%"=="" set CMD=%CMD% --ip %IP_ADDRESS% 
if not "%WS_PORT%"=="8080" set CMD=%CMD% --port %WS_PORT% 

echo ======================================== 
echo   Starting ControlTV Service... 
echo ======================================== 
echo. 
echo Command: %CMD% 
echo. 

%CMD% 

pause 
