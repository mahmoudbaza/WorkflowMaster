#!/bin/bash

# Set deployment directory
DEPLOY_DIR="deployment"
APP_DIR="$DEPLOY_DIR/app"
DIST_ZIP="internal_portal_system_deployment.zip"

# Create app directory
mkdir -p "$APP_DIR"

# Copy application files
echo "Copying application files..."
mkdir -p "$APP_DIR/client" "$APP_DIR/server" "$APP_DIR/shared" "$APP_DIR/database" "$APP_DIR/logs" "$APP_DIR/uploads"

# Copy client files
cp -r client/dist/* "$APP_DIR/client/"

# Copy server files
cp -r server/* "$APP_DIR/server/"

# Copy shared files
cp -r shared/* "$APP_DIR/shared/"

# Copy database files
cp -r database/* "$APP_DIR/database/"

# Copy configuration files
cp package.json tsconfig.json "$APP_DIR/"

# Create environment template
echo "# Database Configuration
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
" > "$APP_DIR/.env.template"

# Create zip file
echo "Creating deployment package zip file..."
cd "$DEPLOY_DIR"
zip -r "../$DIST_ZIP" *
cd ..

echo "Deployment package created: $DIST_ZIP"
echo "Use this file for deployment to Windows Server 2022."