/**
 * Service Factory - Creates singleton instances of services to prevent duplicates
 */

const serviceRegistry = require('../utils/serviceRegistry');

/**
 * ContractService Singleton Wrapper
 */
function createContractService() {
  const ContractService = require('../services/contractService');
  return serviceRegistry.getService(ContractService, 'ContractService');
}

/**
 * PaymentService Singleton Wrapper
 */
function createPaymentService() {
  const PaymentService = require('../services/paymentService');
  return serviceRegistry.getService(PaymentService, 'PaymentService');
}

/**
 * WebSocketService Singleton Wrapper
 */
function createWebSocketService() {
  const WebSocketService = require('../services/webSocketService');
  return serviceRegistry.getService(WebSocketService, 'WebSocketService');
}

/**
 * RBACService Singleton Wrapper
 */
function createRBACService() {
  const RBACService = require('../services/rbacService');
  return serviceRegistry.getService(RBACService, 'RBACService');
}

/**
 * MultiSigService Singleton Wrapper
 */
function createMultiSigService() {
  const MultiSigService = require('../services/multiSigService');
  return serviceRegistry.getService(MultiSigService, 'MultiSigService');
}

/**
 * AutomatedPaymentService Singleton Wrapper
 */
function createAutomatedPaymentService() {
  const AutomatedPaymentService = require('../services/automatedPaymentService');
  return serviceRegistry.getService(AutomatedPaymentService, 'AutomatedPaymentService');
}

module.exports = {
  createContractService,
  createPaymentService,
  createWebSocketService,
  createRBACService,
  createMultiSigService,
  createAutomatedPaymentService,
  serviceRegistry
};
