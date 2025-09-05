# SmartPay - Automated Milestone-Based Freelance Payment System

## 🚀 Overview

SmartPay is a decentralized freelance payment platform that automates milestone-based payments using smart contracts. The system provides secure, auditable, and gas-efficient automation for freelance work with multiple verification methods.

## 📋 Smart Contract Components

### Core Contracts

#### 1. **AutomatedMilestoneEscrow.sol** - Main Contract
- **Purpose**: Core escrow system with automated milestone verification
- **Features**:
  - Multiple verification methods (Client, Oracle, Hybrid, Off-chain)
  - Chainlink Automation integration
  - Time-based auto-approval
  - Comprehensive dispute system
  - Gas-optimized operations

#### 2. **MilestoneEscrow.sol** - Basic Version
- **Purpose**: Simplified milestone escrow without automation
- **Features**:
  - Manual client approval system
  - Basic dispute resolution
  - Standard escrow functionality

#### 3. **SmartPay.sol** - General Payments
- **Purpose**: Handle general one-time and recurring payments
- **Features**:
  - One-time payments between parties
  - Recurring payment schedules
  - Platform fee collection

#### 4. **MyToken.sol** - Payment Token
- **Purpose**: ERC-20 token for testing and payments
- **Features**:
  - Standard ERC-20 functionality
  - Initial supply allocation
  - Can be used across all payment contracts

### Supporting Components

#### 5. **IOffChainIntegration.sol** - Interfaces
- **Purpose**: Define interfaces for off-chain system integration
- **Includes**:
  - Off-chain verification system interface
  - IPFS integration interface
  - Chainlink automation interface

#### 6. **MockV3Aggregator.sol** - Testing Mock
- **Purpose**: Mock Chainlink price feed for testing
- **Features**:
  - Simulates Chainlink oracle responses
  - Configurable price data
  - Testing utilities

## 🔧 Key Features

### Verification Methods
1. **Client Only**: Traditional manual approval by client
2. **Oracle Only**: Automated approval via Chainlink oracles
3. **Hybrid**: Either client or oracle can approve
4. **Off-Chain Verifier**: Trusted third-party verification

### Automation Features
- **Chainlink Automation**: Automatic milestone checking and approval
- **Time-Based Auto-Approval**: Automatic approval after delay period
- **Quality-Based Approval**: Approval based on verification scores
- **Gas Optimization**: Batched operations and efficient storage

### Security Features
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Role-based permissions system
- **Pausable**: Emergency stop functionality
- **Comprehensive Events**: Full audit trail

## 📚 Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat ignition deploy ignition/modules/AutomatedMilestoneEscrow.ts
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
