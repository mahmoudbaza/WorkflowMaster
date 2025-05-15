# Internal Portal System - Detailed Deployment Guide
## Windows Server 2022 Installation Guide

This guide provides step-by-step instructions for deploying the Internal Portal System on Windows Server 2022. Follow these instructions carefully to ensure a successful deployment.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [SQL Server Installation and Configuration](#sql-server-installation-and-configuration)
4. [Node.js Installation](#nodejs-installation)
5. [IIS Installation and Configuration](#iis-installation-and-configuration)
6. [Application Deployment](#application-deployment)
7. [Database Setup](#database-setup)
8. [Application Configuration](#application-configuration)
9. [Windows Service Setup](#windows-service-setup)
10. [IIS Configuration](#iis-configuration)
11. [SSL Configuration](#ssl-configuration)
12. [Testing the Deployment](#testing-the-deployment)
13. [Troubleshooting](#troubleshooting)
14. [Maintenance and Backup](#maintenance-and-backup)

## System Requirements

### Hardware Requirements

- **CPU**: Minimum 4 cores, recommended 8 cores
- **RAM**: Minimum 16GB, recommended 32GB
- **Storage**: Minimum 100GB SSD, recommended 250GB SSD
- **Network**: 1Gbps Ethernet connection

### Software Requirements

- Windows Server 2022 (Standard or Datacenter edition)
- SQL Server 2019 or later
- Node.js 18.x or later
- Internet Information Services (IIS) 10.0
- .NET Framework 4.8 or later

## Prerequisites Installation

### Step 1: Initial Windows Server Setup

1. Install Windows Server 2022 with the "Desktop Experience" option
2. Apply the latest Windows updates:
   ```
   Start > Settings > Update & Security > Windows Update > Check for updates
   ```
3. Set a static IP address for the server
4. Configure Windows Firewall to allow inbound connections on:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 1433 (SQL Server)

### Step 2: Install Windows Features and Roles

1. Open Server Manager
2. Click on "Add roles and features"
3. Select "Role-based or feature-based installation"
4. Select the destination server
5. Select the following roles:
   - Web Server (IIS)
   - Application Server
6. Select the following features:
   - .NET Framework 4.8 Features
   - WebSocket Protocol
7. In the Web Server (IIS) role services, ensure the following are selected:
   - Web Server
   - Common HTTP Features
     - Static Content
     - Default Document
     - HTTP Errors
     - HTTP Redirection
   - Health and Diagnostics
     - HTTP Logging
     - Request Monitor
   - Security
     - Request Filtering
     - Basic Authentication
     - Client Certificate Mapping Authentication
     - IP and Domain Restrictions
     - URL Authorization
   - Application Development
     - .NET Extensibility
     - ASP.NET
     - ISAPI Extensions
     - ISAPI Filters
     - WebSocket Protocol
   - Management Tools
     - IIS Management Console
8. Complete the installation and restart the server if prompted

### Step 3: Install URL Rewrite Module for IIS

1. Download the URL Rewrite Module from Microsoft's website:
   - [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Run the installer and follow the instructions

## SQL Server Installation and Configuration

### Step 1: Download SQL Server 2019 or Later

1. Download SQL Server 2019 (or later) from the [Microsoft website](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)

### Step 2: Install SQL Server

1. Run the SQL Server installation package
2. Select "Basic" installation type for a simpler setup or "Custom" for more options
3. For custom installation, select the following components:
   - Database Engine Services
   - Client Tools Connectivity

### Step 3: Configure SQL Server

1. Choose a Mixed Mode Authentication (SQL Server and Windows Authentication)
2. Set a strong password for the 'sa' account
3. Add the current Windows user as a SQL Server administrator
4. Keep the default instance name or specify a custom one
5. Leave the default data directories or customize them as needed
6. Click Install and wait for the installation to complete

### Step 4: Configure SQL Server Network Settings

1. Open SQL Server Configuration Manager
2. Navigate to SQL Server Network Configuration > Protocols for MSSQLSERVER (or your instance name)
3. Ensure that TCP/IP protocol is enabled
4. Right-click on TCP/IP and select Properties
5. In the IP Addresses tab, set TCP Port to 1433 for all active IP addresses
6. Click OK and restart the SQL Server service

### Step 5: Create SQL Server Login for the Application

1. Open SQL Server Management Studio
2. Connect to the SQL Server instance
3. In Object Explorer, expand Security > Logins
4. Right-click on Logins and select "New Login..."
5. Enter the login name: "portaluser"
6. Select "SQL Server authentication"
7. Enter a strong password and uncheck "User must change password at next login"
8. Click OK to create the login

## Node.js Installation

### Step 1: Download Node.js

1. Download Node.js LTS version (18.x or later) from the [official website](https://nodejs.org/)
2. Choose the Windows 64-bit installer (.msi)

### Step 2: Install Node.js

1. Run the Node.js installer
2. Accept the license agreement
3. Use the default installation options
4. Complete the installation

### Step 3: Verify the Installation

1. Open Command Prompt
2. Run the following commands to verify Node.js and npm are installed correctly:
   ```
   node --version
   npm --version
   ```

## IIS Installation and Configuration

### Step 1: Verify IIS Installation

1. Open a web browser on the server
2. Navigate to `http://localhost`
3. You should see the default IIS page

### Step 2: Install Additional IIS Components

1. Open Server Manager
2. Click on "Add Roles and Features"
3. Navigate to "Web Server (IIS)" > "Application Development"
4. Ensure the following components are installed:
   - .NET Extensibility 4.8
   - ASP.NET 4.8
   - ISAPI Extensions
   - ISAPI Filters
   - WebSocket Protocol
5. Complete the installation

## Application Deployment

### Step 1: Create Application Directory

1. Create a directory for the application:
   ```
   mkdir C:\PortalSystem
   ```
2. Create the following subdirectories:
   ```
   mkdir C:\PortalSystem\logs
   mkdir C:\PortalSystem\uploads
   ```

### Step 2: Extract the Deployment Package

1. Copy the deployment package ZIP file to the server
2. Extract the contents of the ZIP file
3. Copy all files from the extracted "app" directory to `C:\PortalSystem`

### Step 3: Install Application Dependencies

1. Open Command Prompt as Administrator
2. Navigate to the application directory:
   ```
   cd C:\PortalSystem
   ```
3. Install the required npm packages:
   ```
   npm install --production
   ```

## Database Setup

### Step 1: Create the Database and Tables

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. In Object Explorer, right-click on "Databases" and select "New Database"
4. Enter "PortalDB" as the database name and click OK
5. Right-click on the new "PortalDB" database and select "New Query"
6. Open the database script file from the deployment package:
   ```
   C:\PortalSystem\database\create_database.sql
   ```
7. Execute the script to create the database tables and initial data

### Step 2: Configure Database User Permissions

1. In SQL Server Management Studio, expand the Security folder in the PortalDB database
2. Right-click on "Users" and select "New User..."
3. Enter "portaluser" as the user name
4. Under "Login name", click the ellipsis (...) button and select the "portaluser" login
5. On the "Membership" page, select the "db_owner" role
6. Click OK to create the user

## Application Configuration

### Step 1: Create Environment Configuration

1. Navigate to the application directory:
   ```
   cd C:\PortalSystem
   ```
2. Create a `.env` file by copying the template:
   ```
   copy .env.template .env
   ```
3. Edit the `.env` file with the appropriate settings:
   - Database connection information
   - SMTP server settings
   - Other application settings

### Step 2: Configure Application Settings

1. Navigate to the application directory
2. Create a config.yaml file if it doesn't exist:
   ```
   touch config.yaml
   ```
3. Edit the config.yaml file with the appropriate settings:
   ```yaml
   APP_PORT: 7001
   ATTACHMENT_PATH: "C:/PortalSystem/uploads"
   LOG_PATH: "C:/PortalSystem/logs"
   SIGNATURE_PROVIDER: "docusign"
   ENABLE_EMAIL_APPROVALS: true
   USE_SSO: false
   MAX_ATTACHMENT_SIZE_MB: "10"
   DB_CONNECTION_STRING: "Server=localhost;Database=PortalDB;User Id=portaluser;Password=YourPasswordHere;TrustServerCertificate=True"
   DEPLOY_ENV: "production"
   
   # Email Settings
   EMAIL_SENDER: "portal@yourdomain.com"
   EMAIL_SENDER_NAME: "Internal Portal System"
   ```
4. Replace "YourPasswordHere" with the actual password for the portaluser SQL login

## Windows Service Setup

### Step 1: Install the Windows Service

1. Navigate to the scripts directory:
   ```
   cd C:\path\to\extracted\deployment\scripts
   ```
2. Run the service installation script:
   ```
   install-service.bat
   ```
3. Wait for the installation to complete

### Step 2: Verify the Service Installation

1. Open the Services management console:
   ```
   services.msc
   ```
2. Look for the "InternalPortalSystem" service
3. Verify that the service is running and set to "Automatic" startup

## IIS Configuration

### Step 1: Configure IIS

1. Navigate to the scripts directory:
   ```
   cd C:\path\to\extracted\deployment\scripts
   ```
2. Run the IIS configuration script:
   ```
   configure-iis.bat
   ```
3. Wait for the configuration to complete

### Step 2: Verify IIS Configuration

1. Open IIS Manager:
   ```
   inetmgr
   ```
2. Expand the server node and verify that the "Internal Portal System" site exists
3. Verify that the "PortalSystemAppPool" application pool exists and is running

## SSL Configuration

### Step 1: Obtain an SSL Certificate

1. Purchase an SSL certificate from a trusted Certificate Authority
2. Or generate a self-signed certificate for testing:
   ```
   New-SelfSignedCertificate -DnsName "your-server-name" -CertStoreLocation "cert:\LocalMachine\My"
   ```

### Step 2: Install the SSL Certificate

1. Open IIS Manager
2. Select the server node
3. Double-click on "Server Certificates"
4. Click "Import..." in the Actions pane
5. Browse to your certificate file (.pfx) and enter the password
6. Click OK to import the certificate

### Step 3: Configure HTTPS Binding

1. In IIS Manager, expand the server node
2. Select the "Internal Portal System" site
3. Click "Bindings..." in the Actions pane
4. Click "Add..."
5. Select Type: https, IP address: All Unassigned, Port: 443
6. Select the SSL certificate from the dropdown
7. Click OK to add the binding

### Step 4: Configure HTTP to HTTPS Redirection

1. In IIS Manager, select the "Internal Portal System" site
2. Double-click on "URL Rewrite"
3. Click "Add Rule(s)..." in the Actions pane
4. Select "Blank rule" under "Inbound rules"
5. Name the rule "HTTP to HTTPS redirect"
6. In the Match URL section, set:
   - Requested URL: "Matches the Pattern"
   - Using: "Regular Expressions"
   - Pattern: ".*"
7. In the Conditions section, click "Add..." and set:
   - Condition input: "{HTTPS}"
   - Check if input string: "Matches the Pattern"
   - Pattern: "^OFF$"
8. In the Action section, set:
   - Action type: "Redirect"
   - Redirect URL: "https://{HTTP_HOST}{REQUEST_URI}"
   - Redirect type: "Permanent (301)"
9. Click Apply

## Testing the Deployment

### Step 1: Test Basic Connectivity

1. Open a web browser on a different computer
2. Navigate to the server URL (http://your-server-name or https://your-server-name)
3. Verify that the application login page appears

### Step 2: Test Login Functionality

1. Log in using the default admin credentials:
   - Username: admin
   - Password: admin123
2. Change the default password immediately after first login

### Step 3: Test Application Features

1. Test creating a new request
2. Test the approval workflow
3. Test document uploads
4. Test email notifications (if configured)

## Troubleshooting

### Common Issues and Solutions

#### Application Not Starting

1. Check the Windows Service status:
   ```
   sc query InternalPortalSystem
   ```
2. Check application logs at `C:\PortalSystem\logs`
3. Check Windows Event Viewer for errors

#### Database Connection Issues

1. Verify SQL Server is running:
   ```
   sc query MSSQLSERVER
   ```
2. Test the database connection from Command Prompt:
   ```
   sqlcmd -S localhost -U portaluser -P YourPassword -d PortalDB -Q "SELECT @@VERSION"
   ```
3. Check database connection string in the `.env` file

#### IIS Issues

1. Check IIS application pool status in IIS Manager
2. Verify URL Rewrite module is installed
3. Check IIS logs at `%SystemDrive%\inetpub\logs\LogFiles`

## Maintenance and Backup

### Regular Maintenance Tasks

1. Apply Windows updates monthly
2. Update application dependencies quarterly
3. Monitor disk space usage
4. Rotate and archive log files

### Backup Procedures

#### Database Backup

1. Set up SQL Server Agent job for daily backups:
   ```sql
   USE [msdb]
   GO
   EXEC dbo.sp_add_job @job_name = N'PortalDB_Daily_Backup'
   GO
   EXEC sp_add_jobstep @job_name = N'PortalDB_Daily_Backup', 
     @step_name = N'Backup Database', 
     @subsystem = N'TSQL',
     @command = N'BACKUP DATABASE [PortalDB] TO DISK = N''C:\Backups\PortalDB_$(date:yyyyMMdd).bak'' WITH INIT'
   GO
   EXEC dbo.sp_add_schedule @schedule_name = N'DailyBackup', 
     @freq_type = 4, 
     @freq_interval = 1,
     @active_start_time = 010000
   GO
   EXEC sp_attach_schedule @job_name = N'PortalDB_Daily_Backup', 
     @schedule_name = N'DailyBackup'
   GO
   EXEC dbo.sp_add_jobserver @job_name = N'PortalDB_Daily_Backup'
   GO
   ```

2. Create a retention policy script to delete old backups:
   ```bat
   @echo off
   forfiles /p "C:\Backups" /s /m *.bak /d -30 /c "cmd /c del @path"
   ```

3. Schedule this script to run weekly using Task Scheduler

#### Application Backup

1. Create a batch script to back up application files:
   ```bat
   @echo off
   set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%
   xcopy C:\PortalSystem\* C:\Backups\AppBackup_%TIMESTAMP%\ /E /I /H /Y
   ```

2. Schedule this script to run weekly using Task Scheduler

## Additional Resources

- [Windows Server 2022 Documentation](https://docs.microsoft.com/en-us/windows-server/index)
- [SQL Server 2019 Documentation](https://docs.microsoft.com/en-us/sql/sql-server/sql-server-technical-documentation)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [IIS Documentation](https://docs.microsoft.com/en-us/iis/get-started/planning-your-iis-architecture/introduction-to-iis)

---

This deployment guide is designed to provide a comprehensive walkthrough of the deployment process. If you encounter any issues not covered in this guide, please contact the system administrator or refer to the relevant documentation for additional assistance.