const fs = require('fs');
const path = require('path');

describe('Services Structure Validation', () => {
  const servicesDir = path.join(__dirname, '../src/services');

  test('Services directory should exist', () => {
    expect(fs.existsSync(servicesDir)).toBe(true);
  });

  test('Should have all Phase 1-3 core services', () => {
    const coreServices = [
      'blockchainEventListener.js',
      'ipfsService.js',
      'notificationService.js'
    ];

    coreServices.forEach(service => {
      const servicePath = path.join(servicesDir, service);
      expect(fs.existsSync(servicePath)).toBe(true);
    });
  });

  test('Should have Phase 4 AI services', () => {
    const aiServices = [
      'aiRecommendationService.js',
      'smartContractAnalyticsService.js'
    ];

    aiServices.forEach(service => {
      const servicePath = path.join(servicesDir, service);
      expect(fs.existsSync(servicePath)).toBe(true);
    });
  });

  test('Should have Phase 5 monitoring services', () => {
    const monitoringServices = [
      'advancedErrorHandlingService.js',
      'comprehensiveMonitoringService.js',
      'realTimeAlertingService.js',
      'performanceAnalyticsService.js',
      'operationalDashboardService.js'
    ];

    monitoringServices.forEach(service => {
      const servicePath = path.join(servicesDir, service);
      expect(fs.existsSync(servicePath)).toBe(true);
    });
  });

  test('Services should be valid JavaScript files', () => {
    const serviceFiles = fs.readdirSync(servicesDir).filter(file => file.endsWith('.js'));
    
    serviceFiles.forEach(file => {
      const servicePath = path.join(servicesDir, file);
      const content = fs.readFileSync(servicePath, 'utf8');
      
      // Basic syntax check
      expect(content).toContain('class ');
      expect(content).toContain('module.exports');
    });
  });
});

describe('Controllers Structure Validation', () => {
  const controllersDir = path.join(__dirname, '../src/controllers');

  test('Controllers directory should exist', () => {
    expect(fs.existsSync(controllersDir)).toBe(true);
  });

  test('Should have all core controllers', () => {
    const coreControllers = [
      'userController.js',
      'jobController.js',
      'milestoneController.js',
      'disputeController.js',
      'analyticsController.js',
      'ipfsController.js'
    ];

    coreControllers.forEach(controller => {
      const controllerPath = path.join(controllersDir, controller);
      expect(fs.existsSync(controllerPath)).toBe(true);
    });
  });

  test('Should have phase-specific controllers', () => {
    const phaseControllers = [
      'phase4Controller.js',
      'phase5Controller.js'
    ];

    phaseControllers.forEach(controller => {
      const controllerPath = path.join(controllersDir, controller);
      expect(fs.existsSync(controllerPath)).toBe(true);
    });
  });
});

describe('Routes Structure Validation', () => {
  const routesDir = path.join(__dirname, '../src/routes');

  test('Routes directory should exist', () => {
    expect(fs.existsSync(routesDir)).toBe(true);
  });

  test('Should have all route files', () => {
    const routeFiles = [
      'userRoutes.js',
      'jobRoutes.js',
      'milestoneRoutes.js',
      'disputeRoutes.js',
      'analyticsRoutes.js',
      'ipfsRoutes.js',
      'paymentRoutes.js',
      'advancedRoutes.js',
      'phase4Routes.js',
      'phase5Routes.js'
    ];

    routeFiles.forEach(route => {
      const routePath = path.join(routesDir, route);
      expect(fs.existsSync(routePath)).toBe(true);
    });
  });

  test('Route files should export express router', () => {
    const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
    
    routeFiles.forEach(file => {
      const routePath = path.join(routesDir, file);
      const content = fs.readFileSync(routePath, 'utf8');
      
      // Check for router export
      expect(content).toMatch(/module\.exports\s*=.*router/);
    });
  });
});

describe('Models Structure Validation', () => {
  const modelsDir = path.join(__dirname, '../src/models');

  test('Models directory should exist', () => {
    expect(fs.existsSync(modelsDir)).toBe(true);
  });

  test('Should have core models', () => {
    const coreModels = [
      'User.js',
      'Job.js',
      'Event.js'
    ];

    coreModels.forEach(model => {
      const modelPath = path.join(modelsDir, model);
      expect(fs.existsSync(modelPath)).toBe(true);
    });
  });

  test('Models should use Mongoose schema', () => {
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
    
    modelFiles.forEach(file => {
      const modelPath = path.join(modelsDir, file);
      const content = fs.readFileSync(modelPath, 'utf8');
      
      // Check for Mongoose schema
      expect(content).toContain('mongoose');
      expect(content).toContain('Schema');
    });
  });
});
