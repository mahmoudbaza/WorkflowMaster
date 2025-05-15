const { Service } = require('node-windows');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create the service
const svc = new Service({
  name: 'InternalPortalSystem',
  description: 'Internal Portal System for workflow management and digital signatures',
  script: path.join(__dirname, '..', 'server', 'index.js'),
  nodeOptions: [],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    }
  ],
  workingDirectory: path.join(__dirname, '..'),
  logpath: logsDir
});

// Listen for the "install" event
svc.on('install', function() {
  console.log('Service installed successfully');
  console.log('Starting service...');
  svc.start();
});

// Listen for the "start" event
svc.on('start', function() {
  console.log('Service started successfully');
  console.log('Visit http://localhost:7001 to access the portal');
});

// Listen for the "error" event
svc.on('error', function(err) {
  console.error('Error occurred:', err);
});

// Install the service
console.log('Installing Internal Portal System as a Windows service...');
svc.install();