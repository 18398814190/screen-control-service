@echo off 
title AutoStart Setup - ControlTV 

echo ======================================== 
echo   AutoStart Configuration 
echo ======================================== 
echo. 

set CURRENT_DIR=%~dp0 
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%" 
set START_BAT=%CURRENT_DIR%\start.bat 
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup 

echo Select option: 
echo   1. Enable AutoStart 
echo   2. Disable AutoStart 
echo   3. Check Status 
echo. 
set /p CHOICE="Enter (1/2/3): " 


if "%CHOICE%"=="1" goto enable 
if "%CHOICE%"=="2" goto disable 
if "%CHOICE%"=="3" goto status 
Invalid option 
pause 
exit /b 

:enable 
echo Enabling AutoStart... 
set PS_SCRIPT=%TEMP%\ctrltv_autostart.ps1 
echo $ws = New-Object -ComObject WScript.Shell > %PS_SCRIPT% 
echo $lnkPath = [Environment]::GetFolderPath('Startup') + '\ControlTV.lnk' >> %PS_SCRIPT% 
echo $sc = $ws.CreateShortcut($lnkPath) >> %PS_SCRIPT% 
echo $sc.TargetPath = '%START_BAT%' >> %PS_SCRIPT% 
echo $sc.WorkingDirectory = '%CURRENT_DIR%' >> %PS_SCRIPT% 
echo $sc.Save() >> %PS_SCRIPT% 
powershell -ExecutionPolicy Bypass -File %PS_SCRIPT% 
del %PS_SCRIPT% 
if %errorlevel% equ 0 ( 
    echo. 
    echo AutoStart enabled! 
) else ( 
    echo. 
    echo [Error] Failed, run as administrator 
) 
pause 
exit /b 

:disable 
echo Disabling AutoStart... 
set PS_SCRIPT2=%TEMP%\ctrltv_autostart_del.ps1 
echo $lnkPath = [Environment]::GetFolderPath('Startup') + '\ControlTV.lnk' > %PS_SCRIPT2% 
echo if (Test-Path $lnkPath) { Remove-Item $lnkPath; echo 'Disabled' } else { echo 'Not enabled' } >> %PS_SCRIPT2% 
powershell -ExecutionPolicy Bypass -File %PS_SCRIPT2% 
del %PS_SCRIPT2% 
pause 
exit /b 

:status 
set PS_SCRIPT3=%TEMP%\ctrltv_autostart_status.ps1 
echo $lnkPath = [Environment]::GetFolderPath('Startup') + '\ControlTV.lnk' > %PS_SCRIPT3% 
echo if (Test-Path $lnkPath) { echo 'Status: Enabled' } else { echo 'Status: Disabled' } >> %PS_SCRIPT3% 
powershell -ExecutionPolicy Bypass -File %PS_SCRIPT3% 
del %PS_SCRIPT3% 
pause 
