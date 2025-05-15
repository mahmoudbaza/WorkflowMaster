const { Service } = require('node-windows');
const path = require('path');

// Define service
const svc = new Service({
  name: 'InternalPortalSystem',
  description: 'Internal Portal System for workflow management and digital signatures',
  script: path.join(__dirname, '..', 'server', 'index.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('Internal Portal System service has been uninstalled.');
});

// Listen for the "error" event
svc.on('error', function(err) {
  console.error('Error occurred:', err);
});

// Uninstall the service
console.log('Uninstalling Internal Portal System Windows service...');
svc.uninstall();