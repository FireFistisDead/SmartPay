/**
 * Global Service Registry - Prevents duplicate service initializations
 * This module provides a simple way to get singleton service instances
 */

// Global registry to store service instances
const serviceRegistry = {};
const initializationFlags = {};

/**
 * Get or create a service instance (singleton pattern)
 */
function getService(ServiceClass, serviceName = null) {
  const name = serviceName || ServiceClass.name;
  
  // Return existing instance if available
  if (serviceRegistry[name]) {
    return serviceRegistry[name];
  }
  
  // Prevent duplicate initialization during construction
  if (initializationFlags[name]) {
    return null; // Temporary fallback during initialization
  }
  
  initializationFlags[name] = true;
  
  try {
    // Create new instance
    const service = new ServiceClass();
    serviceRegistry[name] = service;
    
    // Initialize asynchronously to prevent blocking
    if (typeof service.initialize === 'function') {
      setImmediate(async () => {
        try {
          await service.initialize();
        } catch (error) {
          console.warn(`Service ${name} initialization failed:`, error.message);
        } finally {
          delete initializationFlags[name];
        }
      });
    } else {
      delete initializationFlags[name];
    }
    
    return service;
    
  } catch (error) {
    delete initializationFlags[name];
    console.warn(`Failed to create service ${name}:`, error.message);
    return null;
  }
}

/**
 * Get an existing service without creating it
 */
function getExistingService(serviceName) {
  return serviceRegistry[serviceName] || null;
}

/**
 * Check if a service exists in the registry
 */
function hasService(serviceName) {
  return !!serviceRegistry[serviceName];
}

/**
 * Clear all services (for testing or shutdown)
 */
function clearServices() {
  Object.keys(serviceRegistry).forEach(key => {
    delete serviceRegistry[key];
  });
  Object.keys(initializationFlags).forEach(key => {
    delete initializationFlags[key];
  });
}

module.exports = {
  getService,
  getExistingService,
  hasService,
  clearServices
};
