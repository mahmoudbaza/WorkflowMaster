# Internal Portal System - Deployment Package

## Overview
This package contains the complete Internal Portal System application for installation on Windows Server 2022. The system includes dynamic workflows, digital signatures, announcements, and Microsoft integration capabilities.

## Prerequisites
- Windows Server 2022
- Microsoft SQL Server (Express or higher)
- IIS 10 or higher

## Automatic Installation
1. Extract this package to a local directory
2. Right-click on `deploy.bat` and select "Run as Administrator"
3. Follow the on-screen prompts

## Manual Installation
If you prefer to install components separately, follow these steps:

### 1. Database Setup
1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Run the script at `database/create_database.sql`

### 2. Application Setup
1. Install Node.js if not already installed
2. Copy the `app` directory to your desired location
3. Copy the `.env.template` file to `.env` and update its values
4. Open a command prompt as Administrator
5. Navigate to the application directory
6. Run `npm install`
7. Run `npm run build`
8. Run `node scripts/install-service.js` to install as a Windows service

### 3. IIS Setup
1. Open IIS Manager
2. Create a new website pointing to the application directory
3. Configure the binding to use your desired port (default: 7001)
4. Set the application pool to No Managed Code

## Configuration
After installation, update the `.env` file with your specific settings:
- Database connection details
- Email server settings
- Microsoft integration (if needed)
- Digital signature provider (if needed)

## Default Credentials
- Username: admin
- Password: admin123

**IMPORTANT:** Change the default password immediately after installation.

## Documentation
Detailed documentation is available in the `docs` directory:
- `detailed_deployment_guide.md` - Comprehensive deployment instructions
- `user_guide.md` - End-user documentation

## Support
For support, contact your system administrator or IT support team.

## License
This software is proprietary and licensed for use within your organization only.