const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const buildDir = path.resolve(__dirname, 'dist');
const deploymentDir = path.resolve(__dirname, 'deployment');

console.log('Building Internal Portal System for deployment...');

// Create build and deployment directories
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

if (!fs.existsSync(deploymentDir)) {
  fs.mkdirSync(deploymentDir, { recursive: true });
} else {
  // Clean deployment directory
  fs.rmSync(deploymentDir, { recursive: true, force: true });
  fs.mkdirSync(deploymentDir, { recursive: true });
}

try {
  // Build the client
  console.log('Building client application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Create deployment package structure
  console.log('Creating deployment package...');
  
  // Create directories
  fs.mkdirSync(path.join(deploymentDir, 'app'), { recursive: true });
  fs.mkdirSync(path.join(deploymentDir, 'app', 'client'), { recursive: true });
  fs.mkdirSync(path.join(deploymentDir, 'app', 'server'), { recursive: true });
  fs.mkdirSync(path.join(deploymentDir, 'app', 'database'), { recursive: true });
  fs.mkdirSync(path.join(deploymentDir, 'app', 'shared'), { recursive: true });
  fs.mkdirSync(path.join(deploymentDir, 'app', 'logs'), { recursive: true });
  fs.mkdirSync(path.join(deploymentDir, 'app', 'uploads'), { recursive: true });
  fs.mkdirSync(path.join(deploymentDir, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(deploymentDir, 'scripts'), { recursive: true });
  
  // Copy built client files
  console.log('Copying client files...');
  fs.cpSync(path.join(__dirname, 'dist', 'client'), path.join(deploymentDir, 'app', 'client'), { recursive: true });
  
  // Copy server files
  console.log('Copying server files...');
  fs.cpSync(path.join(__dirname, 'server'), path.join(deploymentDir, 'app', 'server'), { recursive: true });
  
  // Copy database scripts
  console.log('Copying database scripts...');
  fs.cpSync(path.join(__dirname, 'database'), path.join(deploymentDir, 'app', 'database'), { recursive: true });
  
  // Copy shared files
  console.log('Copying shared files...');
  fs.cpSync(path.join(__dirname, 'shared'), path.join(deploymentDir, 'app', 'shared'), { recursive: true });
  
  // Copy configuration and package files
  console.log('Copying configuration files...');
  fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(deploymentDir, 'app', 'package.json'));
  fs.copyFileSync(path.join(__dirname, 'tsconfig.json'), path.join(deploymentDir, 'app', 'tsconfig.json'));
  
  // Copy documentation
  console.log('Copying documentation...');
  fs.cpSync(path.join(__dirname, 'docs'), path.join(deploymentDir, 'docs'), { recursive: true });
  
  // Create sample .env file
  console.log('Creating .env template...');
  const envContent = `# Database Configuration
DB_USER=portaluser
DB_PASSWORD=P@ssw0rd
DB_NAME=PortalDB
DB_SERVER=localhost

# Application Configuration
APP_PORT=7001
NODE_ENV=production

# Email Configuration
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USE_SSL=true
SMTP_USERNAME=portal@yourdomain.com
SMTP_PASSWORD=YourSecurePassword
EMAIL_SENDER=portal@yourdomain.com
EMAIL_SENDER_NAME=Internal Portal System

# Microsoft Integration (Optional)
MS_TENANT_ID=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_REDIRECT_URI=

# Signature Service (Optional)
SIGNATURE_PROVIDER=docusign
SIGNATURE_API_KEY=
SIGNATURE_ACCOUNT_ID=
SIGNATURE_USER_ID=
SIGNATURE_BASE_URI=
`;
  fs.writeFileSync(path.join(deploymentDir, 'app', '.env.template'), envContent);
  
  // Create Windows service installation script
  console.log('Creating Windows service scripts...');
  const serviceInstallScript = `@echo off
echo Installing Internal Portal System as a Windows Service...

cd %~dp0..\\app
npm install -g node-windows
npm link node-windows
node ..\\scripts\\install-service.js

echo Service installation completed!
pause
`;
  fs.writeFileSync(path.join(deploymentDir, 'scripts', 'install-service.bat'), serviceInstallScript);

  const serviceUninstallScript = `@echo off
echo Uninstalling Internal Portal System Windows Service...

cd %~dp0..\\app
node ..\\scripts\\uninstall-service.js

echo Service uninstallation completed!
pause
`;
  fs.writeFileSync(path.join(deploymentDir, 'scripts', 'uninstall-service.bat'), serviceUninstallScript);

  const serviceInstallJs = `const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'InternalPortalSystem',
  description: 'Internal Portal System Node.js Service',
  script: path.join(process.cwd(), 'server', 'index.js'),
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
`;
  fs.writeFileSync(path.join(deploymentDir, 'scripts', 'install-service.js'), serviceInstallJs);

  const serviceUninstallJs = `const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'InternalPortalSystem',
  script: path.join(process.cwd(), 'server', 'index.js')
});

svc.on('uninstall', function() {
  console.log('Service uninstalled successfully');
});

svc.uninstall();
`;
  fs.writeFileSync(path.join(deploymentDir, 'scripts', 'uninstall-service.js'), serviceUninstallJs);

  // Create IIS configuration scripts
  const iisConfigScript = `@echo off
echo Configuring IIS for Internal Portal System...

:: Create IIS Application Pool
%windir%\\system32\\inetsrv\\appcmd add apppool /name:"PortalSystemAppPool" /managedRuntimeVersion:"" /managedPipelineMode:Integrated

:: Set Application Pool to start automatically
%windir%\\system32\\inetsrv\\appcmd set apppool "PortalSystemAppPool" /autoStart:true

:: Set Application Pool identity to ApplicationPoolIdentity
%windir%\\system32\\inetsrv\\appcmd set apppool "PortalSystemAppPool" /processModel.identityType:ApplicationPoolIdentity

:: Create the IIS Site
%windir%\\system32\\inetsrv\\appcmd add site /name:"Internal Portal System" /physicalPath:"%~dp0..\\app" /bindings:http/*:80:

:: Set the Site to use the Application Pool
%windir%\\system32\\inetsrv\\appcmd set site "Internal Portal System" /applicationDefaults.applicationPool:"PortalSystemAppPool"

:: Set up URL Rewrite rules
echo Creating URL Rewrite rules...
:: Create web.config file with URL Rewrite rules
copy "%~dp0web.config" "%~dp0..\\app\\web.config" /y

echo IIS configuration completed!
pause
`;
  fs.writeFileSync(path.join(deploymentDir, 'scripts', 'configure-iis.bat'), iisConfigScript);

  const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Reverse Proxy to Node.js" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:7001/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
`;
  fs.writeFileSync(path.join(deploymentDir, 'scripts', 'web.config'), webConfig);

  // Create a README file for the deployment package
  console.log('Creating README file...');
  const readmeContent = `# Internal Portal System Deployment Package

This package contains everything needed to deploy the Internal Portal System to a Windows Server 2022 environment.

## Package Contents

- \`app/\` - The application files
  - \`client/\` - Built client-side files
  - \`server/\` - Server-side files
  - \`database/\` - Database scripts
  - \`shared/\` - Shared modules
  - \`logs/\` - Log files directory (initially empty)
  - \`uploads/\` - Upload files directory (initially empty)
- \`docs/\` - Documentation
  - \`deployment_guide.md\` - Detailed deployment instructions
  - \`user_guide.md\` - User guide for the application
- \`scripts/\` - Installation and deployment scripts
  - \`install-service.bat\` - Script to install the application as a Windows service
  - \`uninstall-service.bat\` - Script to uninstall the Windows service
  - \`configure-iis.bat\` - Script to configure IIS for the application

## Deployment Steps

1. Please refer to \`docs/deployment_guide.md\` for detailed deployment instructions.
2. Follow the step-by-step guide to install prerequisites, configure the database, and set up the application.

## Support

If you encounter any issues during deployment, please contact the system administrator.
`;
  fs.writeFileSync(path.join(deploymentDir, 'README.md'), readmeContent);

  // Create a ZIP file of the deployment package
  console.log('Creating ZIP file...');
  const zipCommand = process.platform === 'win32'
    ? `powershell -command "Compress-Archive -Path '${deploymentDir}\\*' -DestinationPath '${deploymentDir}.zip' -Force"`
    : `cd "${deploymentDir}" && zip -r "../deployment.zip" .`;
  execSync(zipCommand);

  console.log('Deployment package created successfully:');
  console.log(`- Full deployment directory: ${deploymentDir}`);
  console.log(`- Deployment ZIP: ${deploymentDir}.zip`);
  
} catch (error) {
  console.error('Error creating deployment package:', error);
  process.exit(1);
}