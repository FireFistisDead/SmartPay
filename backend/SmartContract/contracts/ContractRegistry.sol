// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ContractRegistry
 * @dev Simple registry contract to store and manage deployed contract addresses
 */
contract ContractRegistry {
    address public owner;
    address public myToken;
    address public mockV3Aggregator;
    address public milestoneEscrow;
    address public smartPay;
    address public automatedMilestoneEscrow;
    
    event ContractRegistered(string contractName, address contractAddress);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerMyToken(address _address) external onlyOwner {
        myToken = _address;
        emit ContractRegistered("MyToken", _address);
    }
    
    function registerMockV3Aggregator(address _address) external onlyOwner {
        mockV3Aggregator = _address;
        emit ContractRegistered("MockV3Aggregator", _address);
    }
    
    function registerMilestoneEscrow(address _address) external onlyOwner {
        milestoneEscrow = _address;
        emit ContractRegistered("MilestoneEscrow", _address);
    }
    
    function registerSmartPay(address _address) external onlyOwner {
        smartPay = _address;
        emit ContractRegistered("SmartPay", _address);
    }
    
    function registerAutomatedMilestoneEscrow(address _address) external onlyOwner {
        automatedMilestoneEscrow = _address;
        emit ContractRegistered("AutomatedMilestoneEscrow", _address);
    }
    
    function registerAllContracts(
        address _myToken,
        address _mockV3Aggregator,
        address _milestoneEscrow,
        address _smartPay,
        address _automatedMilestoneEscrow
    ) external onlyOwner {
        myToken = _myToken;
        mockV3Aggregator = _mockV3Aggregator;
        milestoneEscrow = _milestoneEscrow;
        smartPay = _smartPay;
        automatedMilestoneEscrow = _automatedMilestoneEscrow;
        
        emit ContractRegistered("MyToken", _myToken);
        emit ContractRegistered("MockV3Aggregator", _mockV3Aggregator);
        emit ContractRegistered("MilestoneEscrow", _milestoneEscrow);
        emit ContractRegistered("SmartPay", _smartPay);
        emit ContractRegistered("AutomatedMilestoneEscrow", _automatedMilestoneEscrow);
    }
    
    function getAllContracts() external view returns (
        address _myToken,
        address _mockV3Aggregator,
        address _milestoneEscrow,
        address _smartPay,
        address _automatedMilestoneEscrow
    ) {
        return (myToken, mockV3Aggregator, milestoneEscrow, smartPay, automatedMilestoneEscrow);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
