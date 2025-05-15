# Internal Portal System Deployment Guide

## Prerequisites

- Windows Server 2022 (standard or datacenter edition)
- SQL Server 2019 or later
- Node.js 18.x or later
- .NET Framework 4.8 or later
- Microsoft IIS 10 or later
- Valid SSL certificate

## System Requirements

### Recommended Server Specifications

- **CPU**: Minimum 4 cores
- **RAM**: Minimum 16GB
- **Storage**: Minimum 100GB SSD
- **Network**: 1Gbps Ethernet

### Software Requirements

- Windows Server 2022
- Microsoft SQL Server 2019 or later
- Node.js 18.x or later
- MS SQL Native Client
- URL Rewrite Module for IIS
- Windows Process Activation Service
- WebSocket Protocol

## Installation Steps

### 1. Prepare the Windows Server

1. Install Windows Server 2022 with desktop experience
2. Apply the latest Windows updates
3. Configure Windows Firewall to allow inbound connections on:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 1433 (SQL Server)

### 2. Install Required Software

#### Install IIS and Required Features

1. Open Server Manager
2. Select "Add Roles and Features"
3. Select "Role-based or feature-based installation"
4. Select your server from the server pool
5. Select the following roles:
   - Web Server (IIS)
   - Application Server
6. Select the following features:
   - .NET Framework 4.8 Features
   - WebSocket Protocol
   - URL Rewrite Module
7. Complete the installation

#### Install SQL Server

1. Download and run SQL Server installation package
2. Select "New SQL Server stand-alone installation"
3. Choose the following components:
   - Database Engine Services
   - Client Tools Connectivity
4. Configure SQL Server:
   - Mixed Mode Authentication
   - Set a strong password for the sa account
   - Add the current user to SQL Server administrators

#### Install Node.js

1. Download Node.js for Windows (LTS version)
2. Run the installer with default options
3. Verify installation by running `node --version` in Command Prompt

### 3. Database Setup

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Open and execute the database creation script:
   - Navigate to `database/create_database.sql`
   - Execute the script to create the PortalDB database and necessary tables

4. Create a dedicated SQL user for the application:
   
   ```sql
   USE [master]
   GO
   CREATE LOGIN [portaluser] WITH PASSWORD='P@ssw0rd', DEFAULT_DATABASE=[PortalDB]
   GO
   USE [PortalDB]
   GO
   CREATE USER [portaluser] FOR LOGIN [portaluser]
   GO
   EXEC sp_addrolemember 'db_owner', 'portaluser'
   GO
   ```

### 4. Application Deployment

1. Create application folder:
   ```
   mkdir C:\PortalSystem
   ```

2. Create the following subfolders:
   ```
   mkdir C:\PortalSystem\uploads
   mkdir C:\PortalSystem\logs
   ```

3. Copy all application files to `C:\PortalSystem`

4. Install application dependencies:
   ```
   cd C:\PortalSystem
   npm install
   ```

5. Create configuration file:
   - Create `.env` file in the root directory with the following settings:
     ```
     DB_USER=portaluser
     DB_PASSWORD=P@ssw0rd
     DB_NAME=PortalDB
     DB_SERVER=localhost
     APP_PORT=7001
     NODE_ENV=production
     SIGNATURE_PROVIDER=docusign
     ```

### 5. Configure IIS

1. Open IIS Manager
2. Create a new Application Pool:
   - Name: "PortalSystemAppPool"
   - .NET CLR version: "No Managed Code"
   - Managed pipeline mode: "Integrated"
   - Enable 32-bit applications: False

3. Create a new Website:
   - Site name: "Internal Portal System"
   - Application pool: "PortalSystemAppPool"
   - Physical path: `C:\PortalSystem`
   - Binding: HTTPS, port 443, with your SSL certificate

4. Configure URL Rewrite:
   - Add a rule to forward requests to Node.js application
   - Name: "Reverse Proxy to Node.js"
   - Pattern: (.*)
   - Action: Rewrite
   - Rewrite URL: http://localhost:7001/{R:1}

### 6. Set Up Windows Service for Node.js

1. Install the windows-service package:
   ```
   npm install -g node-windows
   ```

2. Create a service script (service.js):
   ```javascript
   const Service = require('node-windows').Service;
   
   const svc = new Service({
     name: 'InternalPortalSystem',
     description: 'Internal Portal System Node.js Service',
     script: 'C:\\PortalSystem\\server\\index.js',
     nodeOptions: [],
     env: [
       {
         name: "NODE_ENV",
         value: "production"
       }
     ]
   });
   
   svc.on('install', function() {
     svc.start();
     console.log('Service installed successfully');
   });
   
   svc.install();
   ```

3. Install and start the service:
   ```
   node service.js
   ```

## Post-Installation Configuration

### Configure Microsoft Integration (Optional)

If you plan to use Microsoft SSO authentication:

1. Register your application in the Azure portal
2. Update the .env file with your Microsoft credentials:
   ```
   MS_TENANT_ID=your_tenant_id
   MS_CLIENT_ID=your_client_id
   MS_CLIENT_SECRET=your_client_secret
   MS_REDIRECT_URI=https://your-domain.com/auth/microsoft/callback
   ```

3. Update the SSO setting in the application:
   ```sql
   UPDATE [dbo].[SystemSettings] SET [value] = 'true' WHERE [key] = 'USE_SSO'
   ```

### Configure Digital Signature Service

1. Select your preferred digital signature provider (DocuSign or Adobe Sign)
2. Register your application with the signature provider
3. Update the .env file with your signature service credentials:
   ```
   SIGNATURE_API_KEY=your_api_key
   SIGNATURE_ACCOUNT_ID=your_account_id
   SIGNATURE_USER_ID=your_user_id
   SIGNATURE_BASE_URI=https://api-service-url
   ```

4. Update the signature settings in the application:
   ```sql
   UPDATE [dbo].[SystemSettings] SET [value] = 'docusign' WHERE [key] = 'SIGNATURE_PROVIDER'
   ```

## Security Considerations

### SSL Configuration

1. Ensure you have a valid SSL certificate installed
2. Configure HTTPS binding in IIS
3. Set up HTTP to HTTPS redirection

### Firewall Configuration

1. Block all ports except:
   - 80 (HTTP, redirected to HTTPS)
   - 443 (HTTPS)
   - 3389 (RDP for administration)

2. Restrict RDP access to specific IP addresses

### SQL Server Security

1. Ensure SQL Server is not exposed to the internet
2. Use strong passwords for all SQL accounts
3. Enable SQL Server audit logging

## Backup and Recovery

### Database Backup

1. Set up SQL Server Agent jobs for regular backups:
   ```sql
   USE [msdb]
   GO
   
   EXEC dbo.sp_add_job @job_name = N'PortalDB_Daily_Backup'
   GO
   
   EXEC sp_add_jobstep @job_name = N'PortalDB_Daily_Backup', 
     @step_name = N'Backup Database',
     @subsystem = N'TSQL',
     @command = N'BACKUP DATABASE [PortalDB] TO DISK = N''C:\Backup\PortalDB_$(date:yyyyMMdd).bak'' WITH INIT'
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

2. Set up file retention policy:
   - Create a batch script to delete backups older than 30 days
   - Schedule it with Windows Task Scheduler

### Application Backup

1. Create a batch script to back up application files:
   ```batch
   @echo off
   set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%
   xcopy C:\PortalSystem\* C:\Backup\AppBackup_%TIMESTAMP%\ /E /I /H /Y
   ```

2. Schedule the backup script with Windows Task Scheduler

## Troubleshooting

### Common Issues

1. **Application not starting**
   - Check Windows Event Viewer for errors
   - Verify Node.js service is running
   - Check application logs in C:\PortalSystem\logs

2. **Database connection issues**
   - Verify SQL Server is running
   - Check database credentials in .env file
   - Ensure SQL Server allows mixed authentication

3. **IIS issues**
   - Verify application pool is running
   - Check URL Rewrite configuration
   - Ensure IIS has the required modules installed

4. **Microsoft integration issues**
   - Verify Azure AD application settings
   - Check redirect URI configuration
   - Examine application logs for authentication errors

## Monitoring and Maintenance

1. Set up monitoring using Windows Performance Monitor
2. Monitor key metrics:
   - CPU usage
   - Memory usage
   - Disk space
   - Network traffic
   - Application response time

3. Regular maintenance tasks:
   - Windows updates
   - SQL Server updates
   - Node.js updates
   - Database index maintenance
   - Log file rotation