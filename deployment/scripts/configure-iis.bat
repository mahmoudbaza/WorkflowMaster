@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Internal Portal System - IIS Configuration
echo   For Windows Server 2022
echo ===================================================
echo.

:: Check for Admin rights
NET SESSION >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This script requires Administrator privileges.
    echo Please right-click on the script and select "Run as administrator".
    pause
    exit /b 1
)

set "INSTALL_DIR=C:\PortalSystem"
set "SCRIPT_DIR=%~dp0"

echo Checking if IIS is installed...

:: Check if IIS is installed
sc query W3SVC >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: IIS (W3SVC) service was not found.
    echo Please install IIS before running this script.
    pause
    exit /b 1
)

echo IIS is installed.
echo.
echo Checking if URL Rewrite module is installed...

:: Check if URL Rewrite module is installed
if not exist "%ProgramFiles%\IIS\Rewrite\rewrite.dll" (
    echo WARNING: URL Rewrite module might not be installed.
    echo It's recommended to install the URL Rewrite module from:
    echo https://www.iis.net/downloads/microsoft/url-rewrite
    echo.
    set /p CONTINUE=Continue anyway? (Y/N): 
    if /i "!CONTINUE!" NEQ "Y" (
        exit /b 1
    )
)

echo.
echo Creating IIS Application Pool...

:: Create application pool
%windir%\system32\inetsrv\appcmd add apppool /name:"PortalSystemAppPool" /managedRuntimeVersion:"" /managedPipelineMode:Integrated
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Error creating application pool, it might already exist.
) else (
    echo Application pool created successfully.
)

:: Set Application Pool settings
%windir%\system32\inetsrv\appcmd set apppool "PortalSystemAppPool" /autoStart:true
%windir%\system32\inetsrv\appcmd set apppool "PortalSystemAppPool" /processModel.identityType:ApplicationPoolIdentity

echo.
echo Creating IIS Website...

:: Check if website already exists
%windir%\system32\inetsrv\appcmd list site "Internal Portal System" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Website "Internal Portal System" already exists.
    echo.
    set /p CONTINUE=Do you want to delete and recreate it? (Y/N): 
    if /i "!CONTINUE!" EQU "Y" (
        %windir%\system32\inetsrv\appcmd delete site "Internal Portal System"
        echo Website deleted.
    ) else (
        echo Skipping website creation.
        goto skip_website
    )
)

:: Create the IIS website
%windir%\system32\inetsrv\appcmd add site /name:"Internal Portal System" /physicalPath:"%INSTALL_DIR%" /bindings:http/*:80:portal.internal
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create website.
    echo Make sure port 80 is not already in use by another website.
    pause
    exit /b 1
) else (
    echo Website created successfully.
)

:: Set the website to use the application pool
%windir%\system32\inetsrv\appcmd set site "Internal Portal System" /applicationDefaults.applicationPool:"PortalSystemAppPool"

:skip_website

echo.
echo Creating web.config file with URL Rewrite rules...

:: Create web.config file with URL Rewrite rules
set "WEB_CONFIG=%INSTALL_DIR%\web.config"
echo ^<?xml version="1.0" encoding="UTF-8"?^>> "%WEB_CONFIG%"
echo ^<configuration^>>> "%WEB_CONFIG%"
echo   ^<system.webServer^>>> "%WEB_CONFIG%"
echo     ^<rewrite^>>> "%WEB_CONFIG%"
echo       ^<rules^>>> "%WEB_CONFIG%"
echo         ^<rule name="Reverse Proxy to Node.js" stopProcessing="true"^>>> "%WEB_CONFIG%"
echo           ^<match url="(.*)" /^>>> "%WEB_CONFIG%"
echo           ^<action type="Rewrite" url="http://localhost:7001/{R:1}" /^>>> "%WEB_CONFIG%"
echo         ^</rule^>>> "%WEB_CONFIG%"
echo       ^</rules^>>> "%WEB_CONFIG%"
echo     ^</rewrite^>>> "%WEB_CONFIG%"
echo     ^<httpErrors existingResponse="PassThrough" /^>>> "%WEB_CONFIG%"
echo   ^</system.webServer^>>> "%WEB_CONFIG%"
echo ^</configuration^>>> "%WEB_CONFIG%"

echo Created web.config file at: %WEB_CONFIG%

echo.
echo Setting up application directory permissions...

:: Set appropriate permissions
icacls "%INSTALL_DIR%" /grant "IIS AppPool\PortalSystemAppPool":(OI)(CI)RX /T
icacls "%INSTALL_DIR%\logs" /grant "IIS AppPool\PortalSystemAppPool":(OI)(CI)M /T
icacls "%INSTALL_DIR%\uploads" /grant "IIS AppPool\PortalSystemAppPool":(OI)(CI)M /T

echo.
echo ===================================================
echo IIS Configuration completed!
echo.
echo The site should be accessible at: http://portal.internal/
echo (You may need to add this to your hosts file)
echo.
echo To add an entry to your hosts file:
echo 1. Open Notepad as administrator
echo 2. Open C:\Windows\System32\drivers\etc\hosts
echo 3. Add the line: 127.0.0.1 portal.internal
echo 4. Save the file
echo.
echo For SSL/HTTPS configuration, please follow the instructions in 
echo the deployment guide to set up a certificate.
echo ===================================================

pause