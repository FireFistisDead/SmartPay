// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Import all our contracts to verify compilation
import "./MyToken.sol";
import "./MockV3Aggregator.sol";
import "./MilestoneEscrow.sol";
import "./SmartPay.sol";
import "./AutomatedMilestoneEscrow.sol";
import "./IOffChainIntegration.sol";

/**
 * @title ContractRegistry
 * @dev Simple registry contract to verify all contracts compile together
 */
contract ContractRegistry {
    address public myToken;
    address public mockV3Aggregator;
    address public milestoneEscrow;
    address public smartPay;
    address public automatedMilestoneEscrow;
    
    event ContractsDeployed(
        address myToken,
        address mockV3Aggregator,
        address milestoneEscrow,
        address smartPay,
        address automatedMilestoneEscrow
    );
    
    constructor() {
        // This contract serves as a compilation verification
        // All imports should compile successfully
    }
    
    function deployAll(address platformWallet) external returns (
        address tokenAddr,
        address aggregatorAddr,
        address milestoneAddr,
        address smartPayAddr,
        address automatedAddr
    ) {
        // Deploy MyToken
        MyToken token = new MyToken(1000000);
        tokenAddr = address(token);
        
        // Deploy MockV3Aggregator
        MockV3Aggregator aggregator = new MockV3Aggregator(8, 200000000000);
        aggregatorAddr = address(aggregator);
        
        // Deploy MilestoneEscrow
        MilestoneEscrow milestone = new MilestoneEscrow(tokenAddr, platformWallet);
        milestoneAddr = address(milestone);
        
        // Deploy SmartPay
        SmartPay smartPayContract = new SmartPay(tokenAddr, platformWallet);
        smartPayAddr = address(smartPayContract);
        
        // Deploy AutomatedMilestoneEscrow
        AutomatedMilestoneEscrow automated = new AutomatedMilestoneEscrow(
            tokenAddr,
            platformWallet,
            address(0) // automation registry
        );
        automatedAddr = address(automated);
        
        // Store addresses
        myToken = tokenAddr;
        mockV3Aggregator = aggregatorAddr;
        milestoneEscrow = milestoneAddr;
        smartPay = smartPayAddr;
        automatedMilestoneEscrow = automatedAddr;
        
        emit ContractsDeployed(tokenAddr, aggregatorAddr, milestoneAddr, smartPayAddr, automatedAddr);
    }
}
