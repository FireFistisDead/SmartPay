const fs = require('fs');
const path = require('path');

describe('SmartPay Server Structure Validation', () => {
  const serverRoot = path.join(__dirname, '..');

  describe('Directory Structure', () => {
    test('Main directories should exist', () => {
      const mainDirs = ['src', 'test'];
      
      mainDirs.forEach(dir => {
        const dirPath = path.join(serverRoot, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    test('Source directories should exist', () => {
      const srcDirs = [
        'src/config',
        'src/controllers', 
        'src/middleware',
        'src/models',
        'src/routes',
        'src/services',
        'src/utils'
      ];
      
      srcDirs.forEach(dir => {
        const dirPath = path.join(serverRoot, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });

  describe('Core Files', () => {
    test('Main server file should exist', () => {
      const serverFile = path.join(serverRoot, 'src/server.js');
      expect(fs.existsSync(serverFile)).toBe(true);
    });

    test('Package.json should exist', () => {
      const packageFile = path.join(serverRoot, 'package.json');
      expect(fs.existsSync(packageFile)).toBe(true);
    });

    test('Documentation files should exist', () => {
      const docFiles = ['README.md', 'TESTING.md', 'PHASE5_README.md'];
      
      docFiles.forEach(file => {
        const filePath = path.join(serverRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Phase 1-3: Core Platform Files', () => {
    test('Core services should exist', () => {
      const coreServices = [
        'src/services/blockchainEventListener.js',
        'src/services/ipfsService.js',
        'src/services/notificationService.js'
      ];

      coreServices.forEach(service => {
        const servicePath = path.join(serverRoot, service);
        expect(fs.existsSync(servicePath)).toBe(true);
      });
    });

    test('Core controllers should exist', () => {
      const coreControllers = [
        'src/controllers/userController.js',
        'src/controllers/jobController.js',
        'src/controllers/milestoneController.js',
        'src/controllers/disputeController.js',
        'src/controllers/analyticsController.js',
        'src/controllers/ipfsController.js'
      ];

      coreControllers.forEach(controller => {
        const controllerPath = path.join(serverRoot, controller);
        expect(fs.existsSync(controllerPath)).toBe(true);
      });
    });

    test('Core routes should exist', () => {
      const coreRoutes = [
        'src/routes/userRoutes.js',
        'src/routes/jobRoutes.js',
        'src/routes/milestoneRoutes.js',
        'src/routes/disputeRoutes.js',
        'src/routes/analyticsRoutes.js',
        'src/routes/ipfsRoutes.js'
      ];

      coreRoutes.forEach(route => {
        const routePath = path.join(serverRoot, route);
        expect(fs.existsSync(routePath)).toBe(true);
      });
    });

    test('Core models should exist', () => {
      const coreModels = [
        'src/models/User.js',
        'src/models/Job.js',
        'src/models/Event.js'
      ];

      coreModels.forEach(model => {
        const modelPath = path.join(serverRoot, model);
        expect(fs.existsSync(modelPath)).toBe(true);
      });
    });
  });

  describe('Phase 4: AI & Analytics Files', () => {
    test('AI services should exist', () => {
      const aiServices = [
        'src/services/aiRecommendationService.js',
        'src/services/smartContractAnalyticsService.js'
      ];

      aiServices.forEach(service => {
        const servicePath = path.join(serverRoot, service);
        expect(fs.existsSync(servicePath)).toBe(true);
      });
    });

    test('Phase 4 controller should exist', () => {
      const controllerPath = path.join(serverRoot, 'src/controllers/phase4Controller.js');
      expect(fs.existsSync(controllerPath)).toBe(true);
    });

    test('Phase 4 routes should exist', () => {
      const routesPath = path.join(serverRoot, 'src/routes/phase4Routes.js');
      expect(fs.existsSync(routesPath)).toBe(true);
    });
  });

  describe('Phase 5: Monitoring & Error Handling Files', () => {
    test('Monitoring services should exist', () => {
      const monitoringServices = [
        'src/services/advancedErrorHandlingService.js',
        'src/services/comprehensiveMonitoringService.js',
        'src/services/realTimeAlertingService.js',
        'src/services/performanceAnalyticsService.js',
        'src/services/operationalDashboardService.js'
      ];

      monitoringServices.forEach(service => {
        const servicePath = path.join(serverRoot, service);
        expect(fs.existsSync(servicePath)).toBe(true);
      });
    });

    test('Phase 5 controller should exist', () => {
      const controllerPath = path.join(serverRoot, 'src/controllers/phase5Controller.js');
      expect(fs.existsSync(controllerPath)).toBe(true);
    });

    test('Phase 5 routes should exist', () => {
      const routesPath = path.join(serverRoot, 'src/routes/phase5Routes.js');
      expect(fs.existsSync(routesPath)).toBe(true);
    });
  });

  describe('Configuration Files', () => {
    test('Config files should exist', () => {
      const configFiles = [
        'src/config/config.js',
        'src/config/database.js',
        'src/config/redis.js'
      ];

      configFiles.forEach(file => {
        const filePath = path.join(serverRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('Middleware files should exist', () => {
      const middlewareFiles = [
        'src/middleware/auth.js',
        'src/middleware/errorHandler.js',
        'src/middleware/validation.js'
      ];

      middlewareFiles.forEach(file => {
        const filePath = path.join(serverRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('Utility files should exist', () => {
      const utilFiles = [
        'src/utils/helpers.js',
        'src/utils/logger.js'
      ];

      utilFiles.forEach(file => {
        const filePath = path.join(serverRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('File Content Validation', () => {
    test('Server.js should have proper structure', () => {
      const serverPath = path.join(serverRoot, 'src/server.js');
      const content = fs.readFileSync(serverPath, 'utf8');
      
      expect(content).toContain('class Server');
      expect(content).toContain('setupMiddleware');
      expect(content).toContain('setupRoutes');
      expect(content).toContain('initializePhase5Services');
    });

    test('Package.json should have all dependencies', () => {
      const packagePath = path.join(serverRoot, 'package.json');
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Core dependencies
      expect(packageContent.dependencies).toHaveProperty('express');
      expect(packageContent.dependencies).toHaveProperty('mongoose');
      expect(packageContent.dependencies).toHaveProperty('redis');
      expect(packageContent.dependencies).toHaveProperty('ethers');
      expect(packageContent.dependencies).toHaveProperty('socket.io');
      
      // Phase 5 dependencies
      expect(packageContent.dependencies).toHaveProperty('pidusage');
      expect(packageContent.dependencies).toHaveProperty('systeminformation');
      expect(packageContent.dependencies).toHaveProperty('ioredis');
      
      // Dev dependencies
      expect(packageContent.devDependencies).toHaveProperty('jest');
      expect(packageContent.devDependencies).toHaveProperty('supertest');
    });

    test('Services should export classes', () => {
      const servicesDir = path.join(serverRoot, 'src/services');
      const serviceFiles = fs.readdirSync(servicesDir).filter(file => file.endsWith('.js'));
      
      expect(serviceFiles.length).toBeGreaterThan(5); // Should have multiple services
      
      serviceFiles.forEach(file => {
        const servicePath = path.join(servicesDir, file);
        const content = fs.readFileSync(servicePath, 'utf8');
        
        expect(content).toContain('class ');
        expect(content).toContain('module.exports');
      });
    });

    test('Routes should export express router', () => {
      const routesDir = path.join(serverRoot, 'src/routes');
      const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
      
      expect(routeFiles.length).toBeGreaterThan(5); // Should have multiple route files
      
      routeFiles.forEach(file => {
        const routePath = path.join(routesDir, file);
        const content = fs.readFileSync(routePath, 'utf8');
        
        expect(content).toMatch(/module\.exports\s*=.*router/);
      });
    });
  });
});
