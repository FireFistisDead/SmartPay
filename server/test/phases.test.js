const fs = require('fs');
const path = require('path');

describe('Phase 4: AI & Analytics Services', () => {
  test('AI Recommendation Service should exist and be properly structured', () => {
    const servicePath = path.join(__dirname, '../src/services/aiRecommendationService.js');
    expect(fs.existsSync(servicePath)).toBe(true);

    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Check for key AI service methods
    expect(content).toContain('class AIRecommendationService');
    expect(content).toContain('generateJobRecommendations');
    expect(content).toContain('generateFreelancerRecommendations');
    expect(content).toContain('calculateSimilarity');
  });

  test('Smart Contract Analytics Service should exist', () => {
    const servicePath = path.join(__dirname, '../src/services/smartContractAnalyticsService.js');
    expect(fs.existsSync(servicePath)).toBe(true);

    const content = fs.readFileSync(servicePath, 'utf8');
    
    expect(content).toContain('class SmartContractAnalyticsService');
    expect(content).toContain('analyzeContractPerformance');
    expect(content).toContain('predictTransactionCosts');
  });

  test('Phase 4 Controller should have AI endpoints', () => {
    const controllerPath = path.join(__dirname, '../src/controllers/phase4Controller.js');
    expect(fs.existsSync(controllerPath)).toBe(true);

    const content = fs.readFileSync(controllerPath, 'utf8');
    
    expect(content).toContain('getJobRecommendations');
    expect(content).toContain('getFreelancerRecommendations');
    expect(content).toContain('generatePredictions');
  });

  test('Phase 4 Routes should be properly configured', () => {
    const routesPath = path.join(__dirname, '../src/routes/phase4Routes.js');
    expect(fs.existsSync(routesPath)).toBe(true);

    const content = fs.readFileSync(routesPath, 'utf8');
    
    expect(content).toContain('/recommendations/jobs');
    expect(content).toContain('/recommendations/freelancers');
    expect(content).toContain('/analytics/predict');
  });
});

describe('Phase 5: Monitoring & Error Handling Services', () => {
  test('Advanced Error Handling Service should exist', () => {
    const servicePath = path.join(__dirname, '../src/services/advancedErrorHandlingService.js');
    expect(fs.existsSync(servicePath)).toBe(true);

    const content = fs.readFileSync(servicePath, 'utf8');
    
    expect(content).toContain('class AdvancedErrorHandlingService');
    expect(content).toContain('handleError');
    expect(content).toContain('categorizeError');
    expect(content).toContain('generateFingerprint');
  });

  test('Comprehensive Monitoring Service should exist', () => {
    const servicePath = path.join(__dirname, '../src/services/comprehensiveMonitoringService.js');
    expect(fs.existsSync(servicePath)).toBe(true);

    const content = fs.readFileSync(servicePath, 'utf8');
    
    expect(content).toContain('class ComprehensiveMonitoringService');
    expect(content).toContain('collectSystemMetrics');
    expect(content).toContain('performHealthCheck');
  });

  test('Real-time Alerting Service should exist', () => {
    const servicePath = path.join(__dirname, '../src/services/realTimeAlertingService.js');
    expect(fs.existsSync(servicePath)).toBe(true);

    const content = fs.readFileSync(servicePath, 'utf8');
    
    expect(content).toContain('class RealTimeAlertingService');
    expect(content).toContain('createAlert');
    expect(content).toContain('sendNotification');
  });

  test('Performance Analytics Service should exist', () => {
    const servicePath = path.join(__dirname, '../src/services/performanceAnalyticsService.js');
    expect(fs.existsSync(servicePath)).toBe(true);

    const content = fs.readFileSync(servicePath, 'utf8');
    
    expect(content).toContain('class PerformanceAnalyticsService');
    expect(content).toContain('recordMetric');
    expect(content).toContain('detectBottlenecks');
  });

  test('Operational Dashboard Service should exist', () => {
    const servicePath = path.join(__dirname, '../src/services/operationalDashboardService.js');
    expect(fs.existsSync(servicePath)).toBe(true);

    const content = fs.readFileSync(servicePath, 'utf8');
    
    expect(content).toContain('class OperationalDashboardService');
    expect(content).toContain('getDashboardData');
    expect(content).toContain('getHealthCheckSummary');
  });

  test('Phase 5 Controller should have monitoring endpoints', () => {
    const controllerPath = path.join(__dirname, '../src/controllers/phase5Controller.js');
    expect(fs.existsSync(controllerPath)).toBe(true);

    const content = fs.readFileSync(controllerPath, 'utf8');
    
    expect(content).toContain('handleError');
    expect(content).toContain('getSystemMetrics');
    expect(content).toContain('createAlert');
    expect(content).toContain('getDashboard');
  });

  test('Phase 5 Routes should be comprehensive', () => {
    const routesPath = path.join(__dirname, '../src/routes/phase5Routes.js');
    expect(fs.existsSync(routesPath)).toBe(true);

    const content = fs.readFileSync(routesPath, 'utf8');
    
    expect(content).toContain('/errors/handle');
    expect(content).toContain('/monitoring/metrics');
    expect(content).toContain('/alerts');
    expect(content).toContain('/performance/analysis');
    expect(content).toContain('/dashboard');
  });
});
