const Service = require('node-windows').Service;
const path = require('path');

console.log('Setting up Internal Portal System as a Windows Service...');

// Create a new service object
const svc = new Service({
  name: 'InternalPortalSystem',
  description: 'Internal Portal System - Node.js Application',
  script: path.join(process.cwd(), 'server', 'index.js'),
  nodeOptions: [],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    }
  ]
});

// Listen for service install events
svc.on('install', function() {
  console.log('Service installed successfully!');
  svc.start();
  console.log('Service started.');
  console.log('The service can be managed using Windows Services Management Console (services.msc).');
});

// Error handler
svc.on('error', function(err) {
  console.error('Error installing service:', err);
});

// Install the service
console.log('Installing service...');
svc.install();