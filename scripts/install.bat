@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Internal Portal System Installation Script
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

:: Set installation directory
set "INSTALL_DIR=C:\PortalSystem"
set "SCRIPT_DIR=%~dp0"
set "PARENT_DIR=%SCRIPT_DIR%.."

echo Checking prerequisites...

:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js before running this script.
    echo Visit https://nodejs.org/ to download and install Node.js.
    pause
    exit /b 1
)

:: Check Node.js version
for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo Node.js version: %NODE_VERSION%

:: Check for SQL Server
sc query MSSQLSERVER >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: SQL Server (MSSQLSERVER) service was not found.
    echo You may need to install SQL Server if it's not already installed.
    echo.
    set /p CONTINUE=Continue anyway? (Y/N): 
    if /i "!CONTINUE!" NEQ "Y" (
        exit /b 1
    )
)

:: Check if IIS is installed
sc query W3SVC >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: IIS (W3SVC) service was not found.
    echo You may need to install IIS if it's not already installed.
    echo.
    set /p CONTINUE=Continue anyway? (Y/N): 
    if /i "!CONTINUE!" NEQ "Y" (
        exit /b 1
    )
)

echo.
echo Checking installation directory...

:: Create installation directory if it doesn't exist
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory...
    mkdir "%INSTALL_DIR%"
    mkdir "%INSTALL_DIR%\logs"
    mkdir "%INSTALL_DIR%\uploads"
) else (
    echo WARNING: Installation directory already exists.
    echo This may overwrite existing files.
    echo.
    set /p CONTINUE=Continue anyway? (Y/N): 
    if /i "!CONTINUE!" NEQ "Y" (
        exit /b 1
    )
)

echo.
echo Installing application files...

:: Copy application files
echo Copying client files...
xcopy "%PARENT_DIR%\app\client\*" "%INSTALL_DIR%\client\" /E /I /H /Y

echo Copying server files...
xcopy "%PARENT_DIR%\app\server\*" "%INSTALL_DIR%\server\" /E /I /H /Y

echo Copying database files...
xcopy "%PARENT_DIR%\app\database\*" "%INSTALL_DIR%\database\" /E /I /H /Y

echo Copying shared files...
xcopy "%PARENT_DIR%\app\shared\*" "%INSTALL_DIR%\shared\" /E /I /H /Y

echo Copying configuration files...
copy "%PARENT_DIR%\app\package.json" "%INSTALL_DIR%\package.json" /Y
copy "%PARENT_DIR%\app\tsconfig.json" "%INSTALL_DIR%\tsconfig.json" /Y
copy "%PARENT_DIR%\app\.env.template" "%INSTALL_DIR%\.env.template" /Y

echo.
echo Installing NPM dependencies...
cd "%INSTALL_DIR%"
call npm install --production

echo.
echo Setting up configuration...

:: Create .env file from template if it doesn't exist
if not exist "%INSTALL_DIR%\.env" (
    copy "%INSTALL_DIR%\.env.template" "%INSTALL_DIR%\.env" /Y
    echo Created .env file from template.
    echo Please edit '%INSTALL_DIR%\.env' to configure your database and other settings.
) else (
    echo .env file already exists. Keeping existing configuration.
)

echo.
echo Setting up Windows Service...

:: Install Windows service
echo Installing Node-Windows...
cd "%INSTALL_DIR%"
call npm install -g node-windows
call npm link node-windows

echo Creating Windows Service...
copy "%PARENT_DIR%\scripts\install-service.js" "%INSTALL_DIR%\install-service.js" /Y
node "%INSTALL_DIR%\install-service.js"

echo.
echo ===================================================
echo Installation completed!
echo.
echo Next steps:
echo 1. Configure your database connection in %INSTALL_DIR%\.env
echo 2. Create and configure the database using scripts in %INSTALL_DIR%\database
echo 3. Configure IIS to host the application
echo 4. Restart the Windows service 'InternalPortalSystem'
echo.
echo See the documentation in the 'docs' folder for detailed instructions.
echo ===================================================

pause