// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IOffChainIntegration
 * @dev Interfaces for off-chain system integration
 */

// Interface for off-chain verification system
interface IOffChainVerifier {
    /**
     * @dev Verify milestone completion
     * @param projectId The project identifier
     * @param milestoneId The milestone identifier
     * @param freelancer The freelancer address
     * @param client The client address
     * @return verified Whether the milestone is verified
     * @return score Quality score (0-100)
     * @return timestamp Verification timestamp
     */
    function verifyMilestone(
        uint256 projectId,
        uint256 milestoneId,
        address freelancer,
        address client
    ) external view returns (bool verified, uint8 score, uint256 timestamp);

    /**
     * @dev Check if verifier is authorized
     * @param verifier The verifier address
     * @return authorized Whether the verifier is authorized
     */
    function isAuthorizedVerifier(address verifier) external view returns (bool authorized);
}

// Interface for IPFS integration
interface IIPFSIntegration {
    /**
     * @dev Store milestone data on IPFS
     * @param projectId The project identifier
     * @param milestoneId The milestone identifier
     * @param data The data to store
     * @return ipfsHash The IPFS hash of stored data
     */
    function storeMilestoneData(
        uint256 projectId,
        uint256 milestoneId,
        bytes calldata data
    ) external returns (string memory ipfsHash);

    /**
     * @dev Retrieve milestone data from IPFS
     * @param ipfsHash The IPFS hash
     * @return data The retrieved data
     */
    function retrieveMilestoneData(string calldata ipfsHash) external view returns (bytes memory data);
}

// Interface for Chainlink automation
interface IChainlinkAutomation {
    /**
     * @dev Check if upkeep is needed
     * @param checkData The check data
     * @return upkeepNeeded Whether upkeep is needed
     * @return performData The data to perform upkeep with
     */
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData);

    /**
     * @dev Perform upkeep
     * @param performData The data to perform upkeep with
     */
    function performUpkeep(bytes calldata performData) external;
}

// Interface for price feeds
interface IAggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
