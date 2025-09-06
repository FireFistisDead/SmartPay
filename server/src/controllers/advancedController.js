const { catchAsync } = require('../middleware/errorHandler');
const MultiSigService = require('../services/multiSigService');
const AutomatedPaymentService = require('../services/automatedPaymentService');
const AdvancedAnalyticsService = require('../services/advancedAnalyticsService');
const RBACService = require('../services/rbacService');
const SecurityService = require('../services/securityService');
const logger = require('../utils/logger');

// Initialize services
const multiSigService = new MultiSigService();
const automatedPaymentService = new AutomatedPaymentService();
const advancedAnalyticsService = new AdvancedAnalyticsService();
const rbacService = new RBACService();
const securityService = new SecurityService();

// Initialize all services
Promise.all([
  multiSigService.initialize(),
  automatedPaymentService.initialize(),
  advancedAnalyticsService.initialize(),
  rbacService.initialize()
]).catch(error => {
  logger.error('Error initializing advanced services:', error);
});

/**
 * Multi-signature Controllers
 */
const proposeMultiSigTransaction = catchAsync(async (req, res) => {
  const result = await multiSigService.proposeTransaction(req.body);
  
  res.status(201).json({
    success: true,
    data: result,
    message: 'Multi-signature transaction proposed successfully'
  });
});

const signMultiSigProposal = catchAsync(async (req, res) => {
  const { proposalId } = req.params;
  const { signature } = req.body;
  const signerAddress = req.user.walletAddress;
  
  const result = await multiSigService.signProposal(proposalId, signerAddress, signature);
  
  res.status(200).json({
    success: true,
    data: result,
    message: 'Proposal signed successfully'
  });
});

const executeMultiSigProposal = catchAsync(async (req, res) => {
  const { proposalId } = req.params;
  const executorAddress = req.user.walletAddress;
  
  const result = await multiSigService.executeProposal(proposalId, executorAddress);
  
  res.status(200).json({
    success: true,
    data: result,
    message: 'Multi-signature transaction executed successfully'
  });
});

const getMultiSigProposal = catchAsync(async (req, res) => {
  const { proposalId } = req.params;
  
  const proposal = await multiSigService.getProposal(proposalId);
  
  res.status(200).json({
    success: true,
    data: proposal
  });
});

const listMultiSigProposals = catchAsync(async (req, res) => {
  const result = await multiSigService.listProposals(req.query);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

const cancelMultiSigProposal = catchAsync(async (req, res) => {
  const { proposalId } = req.params;
  const cancelerAddress = req.user.walletAddress;
  
  const result = await multiSigService.cancelProposal(proposalId, cancelerAddress);
  
  res.status(200).json({
    success: true,
    data: result,
    message: 'Proposal cancelled successfully'
  });
});

/**
 * Automated Payment Controllers
 */
const createAutomationRule = catchAsync(async (req, res) => {
  const result = await automatedPaymentService.createAutomationRule(req.body);
  
  res.status(201).json({
    success: true,
    data: result,
    message: 'Automation rule created successfully'
  });
});

const getAutomationStatus = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  
  const status = await automatedPaymentService.getAutomationStatus(jobId);
  
  res.status(200).json({
    success: true,
    data: status
  });
});

const schedulePaymentRelease = catchAsync(async (req, res) => {
  const result = await automatedPaymentService.schedulePaymentRelease(req.body);
  
  res.status(201).json({
    success: true,
    data: result,
    message: 'Payment release scheduled successfully'
  });
});

const checkAutomatedPayments = catchAsync(async (req, res) => {
  await automatedPaymentService.checkAutomatedPayments();
  
  res.status(200).json({
    success: true,
    message: 'Automated payment check completed'
  });
});

const executeAutomaticPayment = catchAsync(async (req, res) => {
  const result = await automatedPaymentService.executeAutomaticPayment(req.body);
  
  res.status(200).json({
    success: true,
    data: result,
    message: 'Automatic payment executed successfully'
  });
});

/**
 * Advanced Analytics Controllers
 */
const getPlatformAnalytics = catchAsync(async (req, res) => {
  const { timeframe = '30d', includeMLInsights = true } = req.query;
  
  const analytics = await advancedAnalyticsService.getPlatformAnalytics(
    timeframe, 
    includeMLInsights === 'true'
  );
  
  res.status(200).json({
    success: true,
    data: analytics
  });
});

const predictProjectSuccess = catchAsync(async (req, res) => {
  const prediction = await advancedAnalyticsService.predictProjectSuccess(req.body);
  
  res.status(200).json({
    success: true,
    data: prediction
  });
});

const analyzePaymentRisk = catchAsync(async (req, res) => {
  const riskAnalysis = await advancedAnalyticsService.analyzePaymentRisk(req.body);
  
  res.status(200).json({
    success: true,
    data: riskAnalysis
  });
});

const forecastTokenPrice = catchAsync(async (req, res) => {
  const { tokenSymbol, timeHorizon = '7d' } = req.query;
  
  const forecast = await advancedAnalyticsService.forecastTokenPrice(tokenSymbol, timeHorizon);
  
  res.status(200).json({
    success: true,
    data: forecast
  });
});

const analyzeUserBehavior = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const behaviorAnalysis = await advancedAnalyticsService.analyzeUserBehavior(userId);
  
  res.status(200).json({
    success: true,
    data: behaviorAnalysis
  });
});

const getMarketInsights = catchAsync(async (req, res) => {
  const insights = await advancedAnalyticsService.getMarketInsights();
  
  res.status(200).json({
    success: true,
    data: insights
  });
});

const getRealTimeDashboard = catchAsync(async (req, res) => {
  const dashboard = await advancedAnalyticsService.getRealTimeDashboard();
  
  res.status(200).json({
    success: true,
    data: dashboard
  });
});

/**
 * RBAC Controllers
 */
const assignRole = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { roleName } = req.body;
  
  await rbacService.assignRole(userId, roleName);
  
  res.status(200).json({
    success: true,
    message: 'Role assigned successfully'
  });
});

const removeRole = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { roleName } = req.body;
  
  await rbacService.removeRole(userId, roleName);
  
  res.status(200).json({
    success: true,
    message: 'Role removed successfully'
  });
});

const createPermission = catchAsync(async (req, res) => {
  const permission = await rbacService.createPermission(req.body);
  
  res.status(201).json({
    success: true,
    data: permission,
    message: 'Permission created successfully'
  });
});

const createRole = catchAsync(async (req, res) => {
  const role = await rbacService.createRole(req.body);
  
  res.status(201).json({
    success: true,
    data: role,
    message: 'Role created successfully'
  });
});

const getUserPermissions = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const permissions = await rbacService.getUserPermissions(userId);
  
  res.status(200).json({
    success: true,
    data: permissions
  });
});

const getAllRoles = catchAsync(async (req, res) => {
  const roles = rbacService.getAllRoles();
  
  res.status(200).json({
    success: true,
    data: roles
  });
});

const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = rbacService.getAllPermissions();
  
  res.status(200).json({
    success: true,
    data: permissions
  });
});

/**
 * Security Controllers
 */
const getSecurityReport = catchAsync(async (req, res) => {
  const report = securityService.getSecurityReport();
  
  res.status(200).json({
    success: true,
    data: report
  });
});

const validateInput = catchAsync(async (req, res) => {
  const { data, schema } = req.body;
  
  const result = securityService.validateAndSanitize(data, schema);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

const checkPasswordStrength = catchAsync(async (req, res) => {
  const { password } = req.body;
  
  const result = securityService.checkPasswordStrength(password);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

const encryptData = catchAsync(async (req, res) => {
  const { text } = req.body;
  
  const result = securityService.encrypt(text);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

const decryptData = catchAsync(async (req, res) => {
  const { encryptedData } = req.body;
  
  const result = securityService.decrypt(encryptedData);
  
  res.status(200).json({
    success: true,
    data: { decrypted: result }
  });
});

const generateSecureToken = catchAsync(async (req, res) => {
  const { length = 32 } = req.query;
  
  const token = securityService.generateSecureToken(parseInt(length));
  
  res.status(200).json({
    success: true,
    data: { token }
  });
});

module.exports = {
  // Multi-sig operations
  proposeMultiSigTransaction,
  signMultiSigProposal,
  executeMultiSigProposal,
  getMultiSigProposal,
  listMultiSigProposals,
  cancelMultiSigProposal,
  
  // Automated payments
  createAutomationRule,
  getAutomationStatus,
  schedulePaymentRelease,
  checkAutomatedPayments,
  executeAutomaticPayment,
  
  // Advanced analytics
  getPlatformAnalytics,
  predictProjectSuccess,
  analyzePaymentRisk,
  forecastTokenPrice,
  analyzeUserBehavior,
  getMarketInsights,
  getRealTimeDashboard,
  
  // RBAC
  assignRole,
  removeRole,
  createPermission,
  createRole,
  getUserPermissions,
  getAllRoles,
  getAllPermissions,
  
  // Security
  getSecurityReport,
  validateInput,
  checkPasswordStrength,
  encryptData,
  decryptData,
  generateSecureToken
};
