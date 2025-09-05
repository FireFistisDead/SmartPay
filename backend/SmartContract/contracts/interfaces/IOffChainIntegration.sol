// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IOffChainVerificationSystem
 * @dev Interface for integrating with off-chain verification systems
 */
interface IOffChainVerificationSystem {
    
    struct VerificationRequest {
        uint256 jobId;
        uint256 milestoneId;
        address client;
        address freelancer;
        string submissionHash;
        string verificationCriteria;
        uint256 submittedAt;
        uint256 deadline;
    }
    
    struct VerificationResult {
        uint256 jobId;
        uint256 milestoneId;
        bool approved;
        string report;
        uint256 score; // 0-100 quality score
        address verifier;
        uint256 verifiedAt;
    }
    
    /**
     * @dev Submit verification request to off-chain system
     */
    function submitVerificationRequest(VerificationRequest calldata request) external;
    
    /**
     * @dev Get verification result
     */
    function getVerificationResult(uint256 jobId, uint256 milestoneId) 
        external 
        view 
        returns (VerificationResult memory);
    
    /**
     * @dev Check if verification is complete
     */
    function isVerificationComplete(uint256 jobId, uint256 milestoneId) 
        external 
        view 
        returns (bool);
}

/**
 * @title IIPFS
 * @dev Interface for IPFS operations
 */
interface IIPFS {
    
    struct IPFSMetadata {
        string hash;
        uint256 size;
        string contentType;
        uint256 uploadedAt;
        address uploader;
    }
    
    /**
     * @dev Store metadata about IPFS upload
     */
    function storeIPFSMetadata(
        string calldata hash,
        uint256 size,
        string calldata contentType
    ) external;
    
    /**
     * @dev Get IPFS metadata
     */
    function getIPFSMetadata(string calldata hash) 
        external 
        view 
        returns (IPFSMetadata memory);
    
    /**
     * @dev Verify IPFS hash format
     */
    function isValidIPFSHash(string calldata hash) 
        external 
        pure 
        returns (bool);
}

/**
 * @title IChainlinkAutomation
 * @dev Extended interface for Chainlink Automation features
 */
interface IChainlinkAutomation {
    
    struct AutomationConfig {
        uint256 upkeepInterval;
        uint256 autoApprovalDelay;
        bool enableTimeBasedApproval;
        bool enableQualityBasedApproval;
        uint256 minimumQualityScore;
    }
    
    /**
     * @dev Configure automation parameters
     */
    function setAutomationConfig(AutomationConfig calldata config) external;
    
    /**
     * @dev Get automation configuration
     */
    function getAutomationConfig() external view returns (AutomationConfig memory);
    
    /**
     * @dev Manual trigger for automation (emergency use)
     */
    function manualUpkeep(uint256[] calldata jobIds, uint256[] calldata milestoneIds) external;
}
