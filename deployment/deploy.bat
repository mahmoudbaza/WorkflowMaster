@echo off
echo Internal Portal System - Installation

rem Get script directory
set SCRIPT_DIR=%~dp0
echo Script directory: %SCRIPT_DIR%

rem Set installation location
set INSTALL_PATH=C:\PortalSystem
echo Installing to: %INSTALL_PATH%

rem Create directory
mkdir "%INSTALL_PATH%" 2>nul

rem Copy files
echo Copying application files...
xcopy /E /I /Y "%SCRIPT_DIR%app" "%INSTALL_PATH%"
xcopy /E /I /Y "%SCRIPT_DIR%docs" "%INSTALL_PATH%\docs" 2>nul

rem Check for Node.js
echo Checking for Node.js...
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Please install Node.js before continuing.
  start https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi
  echo After installing Node.js, please run the post-install.bat file in the installation directory.
  copy "%SCRIPT_DIR%post-install.bat" "%INSTALL_PATH%"
) else (
  echo Node.js is installed.
  echo Running installation script...
  cd /d "%INSTALL_PATH%"
  if exist "%SCRIPT_DIR%app\.env.template" (
    copy "%SCRIPT_DIR%app\.env.template" "%INSTALL_PATH%\.env"
  ) else (
    echo Warning: .env.template not found
  )
  
  echo Ready to continue with post-installation
  copy "%SCRIPT_DIR%post-install.bat" "%INSTALL_PATH%"
  echo Please run post-install.bat in the %INSTALL_PATH% directory to complete setup
)

echo Initial installation complete!
echo Default admin credentials:
echo Username: admin
echo Password: admin123
echo.
echo Please change the default password after installation is complete.
pause