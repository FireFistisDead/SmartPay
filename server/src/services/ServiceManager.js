const logger = require('../utils/logger');

/**
 * Service Manager - Singleton factory for managing service instances
 * Prevents duplicate service initializations and provides centralized service access
 */
class ServiceManager {
  constructor() {
    if (ServiceManager.instance) {
      return ServiceManager.instance;
    }

    this.services = new Map();
    this.initializing = new Set();
    this.initialized = false;
    
    ServiceManager.instance = this;
  }

  /**
   * Get or create a service instance
   */
  async getService(ServiceClass, serviceName = null) {
    const name = serviceName || ServiceClass.name;
    
    // Return existing instance if available
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Prevent duplicate initialization
    if (this.initializing.has(name)) {
      // Wait for initialization to complete
      while (this.initializing.has(name)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.services.get(name);
    }

    try {
      this.initializing.add(name);
      
      // Create new instance
      const service = new ServiceClass();
      this.services.set(name, service);
      
      // Initialize if the service has an initialize method
      if (typeof service.initialize === 'function') {
        await service.initialize();
      }
      
      logger.debug(`Service ${name} initialized successfully`);
      return service;
      
    } catch (error) {
      logger.warn(`Failed to initialize service ${name}:`, error.message);
      // Remove failed service from cache
      this.services.delete(name);
      throw error;
    } finally {
      this.initializing.delete(name);
    }
  }

  /**
   * Get an already initialized service (throws if not found)
   */
  getExistingService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found. Make sure it's initialized first.`);
    }
    return service;
  }

  /**
   * Check if a service is available
   */
  hasService(serviceName) {
    return this.services.has(serviceName);
  }

  /**
   * Initialize core services
   */
  async initializeCoreServices() {
    if (this.initialized) {
      return;
    }

    try {
      // Import service classes (lazy loading to avoid circular dependencies)
      const ContractService = require('./contractService');
      const PaymentService = require('./paymentService');
      const WebSocketService = require('./webSocketService');
      const RBACService = require('./rbacService');
      const TransactionService = require('./transactionService');

      // Initialize core services in dependency order
      await this.getService(RBACService, 'RBACService');
      await this.getService(TransactionService, 'TransactionService');
      await this.getService(ContractService, 'ContractService');
      await this.getService(PaymentService, 'PaymentService');
      
      this.initialized = true;
      logger.info('Core services initialized through ServiceManager');
      
    } catch (error) {
      logger.error('Failed to initialize core services:', error);
      throw error;
    }
  }

  /**
   * Initialize advanced services (after core services)
   */
  async initializeAdvancedServices() {
    try {
      // Import advanced service classes
      const MultiSigService = require('./multiSigService');
      const AutomatedPaymentService = require('./automatedPaymentService');
      const NotificationService = require('./notificationService');

      // Initialize advanced services
      await this.getService(MultiSigService, 'MultiSigService');
      await this.getService(AutomatedPaymentService, 'AutomatedPaymentService');
      await this.getService(NotificationService, 'NotificationService');
      
      logger.info('Advanced services initialized through ServiceManager');
      
    } catch (error) {
      logger.warn('Some advanced services failed to initialize:', error.message);
      // Don't throw - allow server to continue with core functionality
    }
  }

  /**
   * Initialize WebSocket service separately (needs server instance)
   */
  async initializeWebSocketService(server) {
    try {
      const WebSocketService = require('./webSocketService');
      const webSocketService = await this.getService(WebSocketService, 'WebSocketService');
      
      // Initialize with server instance
      if (typeof webSocketService.initialize === 'function') {
        webSocketService.initialize(server);
      }
      
      // Make available globally
      global.webSocketService = webSocketService;
      
      logger.info('WebSocket service initialized through ServiceManager');
      return webSocketService;
      
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error);
      throw error;
    }
  }

  /**
   * Gracefully shutdown all services
   */
  async shutdown() {
    logger.info('Shutting down services...');
    
    for (const [name, service] of this.services.entries()) {
      try {
        if (typeof service.shutdown === 'function') {
          await service.shutdown();
        }
        logger.debug(`Service ${name} shut down successfully`);
      } catch (error) {
        logger.warn(`Failed to shutdown service ${name}:`, error.message);
      }
    }
    
    this.services.clear();
    this.initialized = false;
    logger.info('All services shut down');
  }

  /**
   * Get service status for monitoring
   */
  getServiceStatus() {
    const status = {};
    for (const [name, service] of this.services.entries()) {
      status[name] = {
        initialized: service.initialized !== false,
        available: true
      };
    }
    return status;
  }
}

// Create singleton instance
const serviceManager = new ServiceManager();

module.exports = serviceManager;
