@echo off
echo Internal Portal System - Post Installation

cd /d "%~dp0"
echo Working directory: %CD%

echo Configuring database connection...
echo Enter SQL Server name (default: localhost):
set /p DB_SERVER=">"
if "%DB_SERVER%"=="" set DB_SERVER=localhost

echo Enter database name (default: PortalDB):
set /p DB_NAME=">"
if "%DB_NAME%"=="" set DB_NAME=PortalDB

echo Enter database username (default: portaluser):
set /p DB_USER=">"
if "%DB_USER%"=="" set DB_USER=portaluser

echo Enter database password (default: P@ssw0rd):
set /p DB_PASSWORD=">"
if "%DB_PASSWORD%"=="" set DB_PASSWORD=P@ssw0rd

echo Updating configuration...
powershell -Command "(Get-Content '.env') -replace 'DB_SERVER=localhost', 'DB_SERVER=%DB_SERVER%' | Set-Content -Path '.env'"
powershell -Command "(Get-Content '.env') -replace 'DB_NAME=PortalDB', 'DB_NAME=%DB_NAME%' | Set-Content -Path '.env'"
powershell -Command "(Get-Content '.env') -replace 'DB_USER=portaluser', 'DB_USER=%DB_USER%' | Set-Content -Path '.env'"
powershell -Command "(Get-Content '.env') -replace 'DB_PASSWORD=P@ssw0rd', 'DB_PASSWORD=%DB_PASSWORD%' | Set-Content -Path '.env'"

echo Installing dependencies...
call npm install

echo Building application...
call npm run build

echo Would you like to set up the database now? (Y/N)
set /p SETUP_DB=">"
if /i "%SETUP_DB%"=="Y" (
  echo Setting up database...
  cd database
  sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -i create_database.sql -o database_setup.log
  cd ..
  echo Database setup complete.
)

echo Would you like to install as a Windows service? (Y/N)
set /p INSTALL_SERVICE=">"
if /i "%INSTALL_SERVICE%"=="Y" (
  echo Installing Windows service...
  node scripts/install-service.js
)

echo Post-installation complete!
echo You can now access the portal at: http://localhost:7001
pause