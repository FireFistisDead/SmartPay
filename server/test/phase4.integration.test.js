const request = require('supertest');
const app = require('../src/server');
const { connectDB } = require('../src/config/database');
const User = require('../src/models/User');
const Job = require('../src/models/Job');

describe('Phase 4 Integration Tests', () => {
  let authToken;
  let testUser;
  let testJob;

  beforeAll(async () => {
    await connectDB();
    
    // Create test user
    testUser = new User({
      walletAddress: '0x1234567890123456789012345678901234567890',
      email: 'test@example.com',
      username: 'testuser',
      role: 'freelancer'
    });
    await testUser.save();

    // Generate auth token
    authToken = testUser.generateAuthToken();

    // Create test job
    testJob = new Job({
      title: 'Test Job for Phase 4',
      description: 'AI recommendation test job',
      budget: 1000,
      client: testUser._id,
      skills: ['javascript', 'blockchain', 'ai'],
      category: 'technology'
    });
    await testJob.save();
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test@example.com' });
    await Job.deleteMany({ title: 'Test Job for Phase 4' });
  });

  describe('Advanced Contract Operations', () => {
    test('should create batch operation', async () => {
      const response = await request(app)
        .post('/api/phase4/contracts/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operations: [
            {
              type: 'milestone_create',
              params: {
                jobId: testJob._id,
                amount: '1000000000000000000',
                description: 'Test milestone'
              }
            }
          ],
          options: {
            gasOptimization: true
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('batchId');
    });

    test('should deploy upgradeable contract', async () => {
      const response = await request(app)
        .post('/api/phase4/contracts/upgradeable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractName: 'TestContract',
          initData: { value: 100 }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('proxyAddress');
    });

    test('should create multi-sig wallet', async () => {
      const response = await request(app)
        .post('/api/phase4/contracts/multisig')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          owners: [
            '0x1234567890123456789012345678901234567890',
            '0x0987654321098765432109876543210987654321'
          ],
          required: 2,
          name: 'Test MultiSig'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('walletAddress');
    });
  });

  describe('Cross-Chain Bridge Operations', () => {
    test('should get supported chains', async () => {
      const response = await request(app)
        .get('/api/phase4/bridge/chains');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should estimate transfer fee', async () => {
      const response = await request(app)
        .get('/api/phase4/bridge/fee')
        .query({
          sourceChain: 'ethereum',
          targetChain: 'polygon',
          token: '0x1234567890123456789012345678901234567890',
          amount: '1000000000000000000'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('estimatedFee');
    });

    test('should initiate cross-chain transfer', async () => {
      const response = await request(app)
        .post('/api/phase4/bridge/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceChain: 'ethereum',
          targetChain: 'polygon',
          token: '0x1234567890123456789012345678901234567890',
          amount: '1000000000000000000',
          recipient: '0x0987654321098765432109876543210987654321'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transferId');
    });
  });

  describe('AI Recommendation Operations', () => {
    test('should get freelancer recommendations', async () => {
      const response = await request(app)
        .get(`/api/phase4/ai/freelancer-recommendations/${testJob._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
    });

    test('should get job recommendations', async () => {
      const response = await request(app)
        .get(`/api/phase4/ai/job-recommendations/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
    });

    test('should optimize price', async () => {
      const response = await request(app)
        .post('/api/phase4/ai/optimize-price')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jobData: {
            title: 'AI Development Project',
            description: 'Develop AI recommendation system',
            skills: ['ai', 'machine-learning', 'python'],
            complexity: 'high',
            duration: '30 days'
          },
          marketData: {
            similar_projects: 5,
            average_rate: 75
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimizedPrice');
    });

    test('should generate insights', async () => {
      const response = await request(app)
        .get('/api/phase4/ai/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          type: 'performance',
          timeframe: '30d'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('insights');
    });
  });

  describe('Enterprise Integration Operations', () => {
    let integrationId;

    test('should register enterprise integration', async () => {
      const response = await request(app)
        .post('/api/phase4/enterprise/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Integration',
          description: 'Integration for testing',
          webhookUrl: 'https://example.com/webhook',
          scopes: ['jobs:read', 'users:read']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('integrationId');
      integrationId = response.body.data.integrationId;
    });

    test('should generate API key', async () => {
      const response = await request(app)
        .post(`/api/phase4/enterprise/integrations/${integrationId}/api-keys`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          permissions: ['read', 'write'],
          expiresIn: 86400 // 24 hours
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('apiKey');
      expect(response.body.data).toHaveProperty('keyId');
    });

    test('should get integration stats', async () => {
      const response = await request(app)
        .get(`/api/phase4/enterprise/integrations/${integrationId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ timeframe: '7d' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('requests');
      expect(response.body.data).toHaveProperty('errors');
    });
  });

  describe('Advanced Security Operations', () => {
    test('should validate zero-trust', async () => {
      const response = await request(app)
        .post('/api/phase4/security/zero-trust/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Device-Fingerprint', 'test-device-fingerprint');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trusted');
      expect(response.body.data).toHaveProperty('riskScore');
    });

    test('should generate security recommendations', async () => {
      const response = await request(app)
        .get('/api/phase4/security/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('securityScore');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    test('should validate compliance', async () => {
      const response = await request(app)
        .post('/api/phase4/security/compliance/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'data_processing',
          data: {
            type: 'user_data',
            purpose: 'recommendation_engine',
            retention: '30d'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('compliant');
    });

    test('should create audit trail', async () => {
      const response = await request(app)
        .post('/api/phase4/security/audit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          event: {
            type: 'user_action',
            description: 'User accessed AI recommendations',
            action: 'view_recommendations',
            resource: 'ai_service'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('auditId');
    });
  });

  describe('Health and Status', () => {
    test('should check Phase 4 health', async () => {
      const response = await request(app)
        .get('/api/phase4/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.services).toHaveProperty('contracts');
      expect(response.body.services).toHaveProperty('crossChain');
      expect(response.body.services).toHaveProperty('ai');
      expect(response.body.services).toHaveProperty('enterprise');
      expect(response.body.services).toHaveProperty('security');
    });

    test('should get Phase 4 status', async () => {
      const response = await request(app)
        .get('/api/phase4/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.phase).toBe(4);
      expect(response.body.features).toBeInstanceOf(Array);
      expect(response.body.version).toBe('4.0.0');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid batch operation', async () => {
      const response = await request(app)
        .post('/api/phase4/contracts/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operations: [], // Empty operations
          options: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should handle invalid cross-chain transfer', async () => {
      const response = await request(app)
        .post('/api/phase4/bridge/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceChain: 'invalid-chain',
          targetChain: 'polygon',
          token: 'invalid-address',
          amount: 'invalid-amount',
          recipient: 'invalid-recipient'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should handle unauthorized access', async () => {
      const response = await request(app)
        .post('/api/phase4/ai/train-model')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          modelType: 'recommendation',
          trainingData: []
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});

module.exports = {
  testPhase4Integration: () => {
    console.log('Phase 4 integration tests configured');
  }
};
