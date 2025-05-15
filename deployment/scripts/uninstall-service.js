const Service = require('node-windows').Service;
const path = require('path');

console.log('Uninstalling Internal Portal System Windows Service...');

// Create a new service object
const svc = new Service({
  name: 'InternalPortalSystem',
  description: 'Internal Portal System - Node.js Application',
  script: path.join(process.cwd(), 'server', 'index.js'),
});

// Listen for uninstall events
svc.on('uninstall', function() {
  console.log('Service uninstalled successfully!');
  console.log('The service has been removed from Windows Services.');
});

// Error handler
svc.on('error', function(err) {
  console.error('Error uninstalling service:', err);
});

// Uninstall the service
console.log('Uninstalling service...');
svc.uninstall();