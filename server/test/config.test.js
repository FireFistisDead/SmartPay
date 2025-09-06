const fs = require('fs');
const path = require('path');

describe('Configuration Files', () => {
  test('Package.json should have all required dependencies', () => {
    const packagePath = path.resolve(__dirname, '../package.json');
    expect(fs.existsSync(packagePath)).toBe(true);

    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Verify dependencies object exists
    expect(packageContent.dependencies).toBeDefined();
    expect(packageContent.devDependencies).toBeDefined();
    
    // Core dependencies
    expect(packageContent.dependencies).toHaveProperty('express');
    expect(packageContent.dependencies).toHaveProperty('mongoose');
    expect(packageContent.dependencies).toHaveProperty('redis');
    expect(packageContent.dependencies).toHaveProperty('ethers');
    
    // Special case for socket.io (property name contains dot)
    expect(packageContent.dependencies['socket.io']).toBeDefined();
    expect(packageContent.dependencies['socket.io']).toMatch(/^\^?\d+\.\d+\.\d+/); // version format
    
    // Phase 5 dependencies
    expect(packageContent.dependencies).toHaveProperty('pidusage');
    expect(packageContent.dependencies).toHaveProperty('systeminformation');
    expect(packageContent.dependencies).toHaveProperty('ioredis');
    
    // Dev dependencies
    expect(packageContent.devDependencies).toHaveProperty('jest');
    expect(packageContent.devDependencies).toHaveProperty('supertest');
  });

  test('Server.js should exist and be properly structured', () => {
    const serverPath = path.resolve(__dirname, '../src/server.js');
    expect(fs.existsSync(serverPath)).toBe(true);

    const content = fs.readFileSync(serverPath, 'utf8');
    
    expect(content).toContain('class Server');
    expect(content).toContain('setupMiddleware');
    expect(content).toContain('setupRoutes');
    expect(content).toContain('initializePhase5Services');
  });

  test('Environment example should exist', () => {
    const envExamplePath = path.resolve(__dirname, '../.env.example');
    
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      
      expect(content).toContain('NODE_ENV');
      expect(content).toContain('MONGODB_URI');
      expect(content).toContain('REDIS_URL');
      expect(content).toContain('JWT_SECRET');
    }
  });

  test('Config directory should have all configuration files', () => {
    const configDir = path.resolve(__dirname, '../src/config');
    expect(fs.existsSync(configDir)).toBe(true);

    const configFiles = ['config.js', 'database.js', 'redis.js'];
    
    configFiles.forEach(file => {
      const filePath = path.resolve(configDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe('Middleware Configuration', () => {
  test('Middleware directory should exist', () => {
    const middlewareDir = path.resolve(__dirname, '../src/middleware');
    expect(fs.existsSync(middlewareDir)).toBe(true);
  });

  test('Should have essential middleware files', () => {
    const middlewareFiles = ['auth.js', 'errorHandler.js', 'validation.js'];
    
    middlewareFiles.forEach(file => {
      const filePath = path.resolve(__dirname, '../src/middleware', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe('Utils Configuration', () => {
  test('Utils directory should exist', () => {
    const utilsDir = path.resolve(__dirname, '../src/utils');
    expect(fs.existsSync(utilsDir)).toBe(true);
  });

  test('Should have utility files', () => {
    const utilFiles = ['helpers.js', 'logger.js'];
    
    utilFiles.forEach(file => {
      const filePath = path.resolve(__dirname, '../src/utils', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('Logger should be properly configured', () => {
    const loggerPath = path.resolve(__dirname, '../src/utils/logger.js');
    
    if (fs.existsSync(loggerPath)) {
      const content = fs.readFileSync(loggerPath, 'utf8');
      expect(content).toContain('winston');
    }
  });
});
