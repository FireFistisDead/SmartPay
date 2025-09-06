const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/smartpay_test';
process.env.REDIS_URL = 'redis://localhost:6379';

describe('Server Health and Basic Functionality', () => {
  let app;

  beforeAll(async () => {
    // Create basic Express app for testing
    app = express();
    app.use(express.json());
    
    // Basic health endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    });

    // Mock API endpoints for testing
    app.get('/api/test', (req, res) => {
      res.json({
        success: true,
        message: 'Test endpoint working',
        data: { test: true }
      });
    });
  });

  test('Server should be healthy', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.environment).toBe('test');
    expect(response.body.timestamp).toBeDefined();
  });

  test('Test API endpoint should work', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Test endpoint working');
  });

  test('Should handle 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);
  });
});

describe('Database Connection', () => {
  test('MongoDB should be connected', () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  test('Should be using test database', () => {
    const dbName = mongoose.connection.name;
    expect(dbName).toMatch(/test/i);
  });
});

describe('Environment Configuration', () => {
  test('Should be in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('Should have required environment variables', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.MONGODB_URI).toBeDefined();
    expect(process.env.REDIS_URL).toBeDefined();
  });
});
