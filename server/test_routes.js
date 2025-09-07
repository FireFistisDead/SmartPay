const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Test userRoutes import
try {
  const userRoutes = require('./src/routes/userRoutes');
  console.log('✓ userRoutes imported successfully');
  
  // Mount the routes
  app.use('/api/users', userRoutes);
  console.log('✓ userRoutes mounted successfully');
  
  // List all routes
  function listRoutes(router, prefix = '') {
    if (router.stack) {
      router.stack.forEach(layer => {
        if (layer.route) {
          console.log(`${prefix}${layer.route.path} [${Object.keys(layer.route.methods).join(', ').toUpperCase()}]`);
        }
      });
    }
  }
  
  console.log('\nRegistered routes:');
  app._router.stack.forEach(layer => {
    if (layer.regexp.source.includes('users')) {
      console.log('Found users route layer');
      if (layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach(route => {
          if (route.route) {
            console.log(`/api/users${route.route.path} [${Object.keys(route.route.methods).join(', ').toUpperCase()}]`);
          }
        });
      }
    }
  });
  
} catch (error) {
  console.error('✗ Error importing userRoutes:', error.message);
  console.error(error.stack);
}
