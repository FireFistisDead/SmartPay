// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MyToken.sol";
import "./IOffChainIntegration.sol";

/**
 * @title AutomatedMilestoneEscrow
 * @dev Core escrow system with automated milestone verification
 * @dev Features: Client verification, time-based auto-approval, comprehensive dispute system
 */
contract AutomatedMilestoneEscrow {
    enum MilestoneStatus { Created, Submitted, Approved, Disputed, Completed, Cancelled }
    enum DisputeStatus { None, Raised, UnderReview, Resolved }
    enum VerificationMethod { ClientOnly, Oracle, Hybrid, OffChain }

    struct Milestone {
        uint256 id;
        uint256 projectId;
        address freelancer;
        address client;
        uint256 amount;
        string description;
        string deliverableHash; // IPFS hash
        uint256 deadline;
        MilestoneStatus status;
        VerificationMethod verificationMethod;
        uint256 submissionTime;
        uint256 approvalTime;
        uint8 qualityScore; // 0-100
        bool autoApprovalEnabled;
    }

    struct Dispute {
        uint256 milestoneId;
        address initiator;
        string reason;
        DisputeStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
        address resolver;
        bool clientFavor;
        string resolution;
    }

    struct Project {
        uint256 id;
        address client;
        address freelancer;
        string title;
        string description;
        uint256 totalBudget;
        uint256 completedBudget;
        uint256 platformFee; // basis points
        VerificationMethod defaultVerificationMethod;
        bool active;
        bool paused;
        uint256 createdAt;
    }

    struct AutomationConfig {
        bool enabled;
        uint256 checkInterval; // seconds
        uint256 autoApprovalDelay; // seconds
        uint256 minQualityScore; // minimum score for auto-approval
        uint256 lastCheckTime;
    }

    // State variables
    MyToken public paymentToken;
    address public owner;
    address public platformWallet;
    address public automationRegistry;
    
    // Configuration
    uint256 public defaultPlatformFee = 250; // 2.5%
    uint256 public disputeWindow = 7 days;
    uint256 public defaultAutoApprovalDelay = 14 days;
    uint256 public minAutoApprovalScore = 80;
    bool public paused = false;

    // Counters
    uint256 private nextProjectId = 1;
    uint256 private nextMilestoneId = 1;

    // Storage mappings
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256[]) public projectMilestones;
    mapping(address => uint256[]) public clientProjects;
    mapping(address => uint256[]) public freelancerProjects;
    mapping(uint256 => AutomationConfig) public projectAutomation;
    
    // Automation tracking
    uint256[] public automatedProjects;
    mapping(uint256 => bool) public isProjectAutomated;

    // Events
    event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed freelancer, uint256 totalBudget);
    event MilestoneCreated(uint256 indexed milestoneId, uint256 indexed projectId, uint256 amount, VerificationMethod verificationMethod);
    event MilestoneSubmitted(uint256 indexed milestoneId, string deliverableHash, uint256 submissionTime);
    event MilestoneApproved(uint256 indexed milestoneId, uint256 approvalTime, bool automated);
    event MilestoneCompleted(uint256 indexed milestoneId, uint256 paymentAmount, uint256 platformFee);
    event DisputeRaised(uint256 indexed milestoneId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed milestoneId, address indexed resolver, bool clientFavor, string resolution);
    event AutomationConfigured(uint256 indexed projectId, bool enabled, uint256 checkInterval, uint256 autoApprovalDelay);
    event AutomatedApproval(uint256 indexed milestoneId, uint8 qualityScore, uint256 timestamp);
    event ContractPaused(bool paused);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    modifier onlyProjectParties(uint256 _projectId) {
        Project memory project = projects[_projectId];
        require(msg.sender == project.client || msg.sender == project.freelancer, "Not project party");
        _;
    }

    modifier onlyClient(uint256 _milestoneId) {
        require(msg.sender == milestones[_milestoneId].client, "Not client");
        _;
    }

    modifier onlyFreelancer(uint256 _milestoneId) {
        require(msg.sender == milestones[_milestoneId].freelancer, "Not freelancer");
        _;
    }

    modifier onlyAutomationRegistry() {
        require(msg.sender == automationRegistry, "Not automation registry");
        _;
    }

    // Constructor
    constructor(
        address _paymentToken,
        address _platformWallet,
        address _automationRegistry
    ) {
        paymentToken = MyToken(_paymentToken);
        owner = msg.sender;
        platformWallet = _platformWallet;
        automationRegistry = _automationRegistry;
    }

    // Reentrancy guard
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    /**
     * @dev Create a new project
     */
    function createProject(
        address _freelancer,
        string memory _title,
        string memory _description,
        uint256 _totalBudget,
        VerificationMethod _defaultVerificationMethod
    ) external whenNotPaused returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_freelancer != msg.sender, "Client and freelancer cannot be same");
        require(_totalBudget > 0, "Budget must be greater than 0");

        uint256 projectId = nextProjectId++;
        
        Project storage project = projects[projectId];
        project.id = projectId;
        project.client = msg.sender;
        project.freelancer = _freelancer;
        project.title = _title;
        project.description = _description;
        project.totalBudget = _totalBudget;
        project.platformFee = defaultPlatformFee;
        project.defaultVerificationMethod = _defaultVerificationMethod;
        project.active = true;
        project.createdAt = block.timestamp;

        clientProjects[msg.sender].push(projectId);
        freelancerProjects[_freelancer].push(projectId);

        // Initialize automation config for client-only verification
        if (_defaultVerificationMethod == VerificationMethod.ClientOnly) {
            AutomationConfig storage automation = projectAutomation[projectId];
            automation.enabled = true;
            automation.checkInterval = 1 hours;
            automation.autoApprovalDelay = defaultAutoApprovalDelay;
            automation.minQualityScore = minAutoApprovalScore;
            automation.lastCheckTime = block.timestamp;
            
            automatedProjects.push(projectId);
            isProjectAutomated[projectId] = true;
            
            emit AutomationConfigured(projectId, true, 1 hours, defaultAutoApprovalDelay);
        }

        emit ProjectCreated(projectId, msg.sender, _freelancer, _totalBudget);
        return projectId;
    }

    /**
     * @dev Create a milestone for a project
     */
    function createMilestone(
        uint256 _projectId,
        uint256 _amount,
        string memory _description,
        uint256 _deadline,
        bool _autoApprovalEnabled
    ) external onlyProjectParties(_projectId) whenNotPaused returns (uint256) {
        Project storage project = projects[_projectId];
        require(project.active && !project.paused, "Project not active");
        require(_amount > 0, "Amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(project.completedBudget + _amount <= project.totalBudget, "Exceeds project budget");

        uint256 milestoneId = nextMilestoneId++;
        
        Milestone storage milestone = milestones[milestoneId];
        milestone.id = milestoneId;
        milestone.projectId = _projectId;
        milestone.freelancer = project.freelancer;
        milestone.client = project.client;
        milestone.amount = _amount;
        milestone.description = _description;
        milestone.deadline = _deadline;
        milestone.status = MilestoneStatus.Created;
        milestone.verificationMethod = project.defaultVerificationMethod;
        milestone.autoApprovalEnabled = _autoApprovalEnabled;

        projectMilestones[_projectId].push(milestoneId);

        // Transfer funds to escrow
        require(
            paymentToken.transferFrom(milestone.client, address(this), _amount),
            "Payment transfer failed"
        );

        emit MilestoneCreated(milestoneId, _projectId, _amount, project.defaultVerificationMethod);
        return milestoneId;
    }

    /**
     * @dev Submit milestone deliverable
     */
    function submitMilestone(
        uint256 _milestoneId,
        string memory _deliverableHash
    ) external onlyFreelancer(_milestoneId) whenNotPaused {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Created, "Invalid milestone status");
        require(block.timestamp <= milestone.deadline, "Deadline passed");
        require(bytes(_deliverableHash).length > 0, "Deliverable hash required");

        milestone.status = MilestoneStatus.Submitted;
        milestone.deliverableHash = _deliverableHash;
        milestone.submissionTime = block.timestamp;

        emit MilestoneSubmitted(_milestoneId, _deliverableHash, block.timestamp);
    }

    /**
     * @dev Approve milestone (client only verification)
     */
    function approveMilestone(uint256 _milestoneId) external onlyClient(_milestoneId) whenNotPaused nonReentrant {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Submitted, "Milestone not submitted");
        require(milestone.verificationMethod == VerificationMethod.ClientOnly, "Not client-only verification");

        milestone.status = MilestoneStatus.Approved;
        milestone.approvalTime = block.timestamp;
        milestone.qualityScore = 100; // Client approval assumes full quality

        emit MilestoneApproved(_milestoneId, block.timestamp, false);
        
        // Process payment
        _completeMilestone(_milestoneId);
    }

    /**
     * @dev Auto-approve milestone after delay period (client-only)
     */
    function autoApproveMilestone(uint256 _milestoneId) external whenNotPaused nonReentrant {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Submitted, "Milestone not submitted");
        require(milestone.verificationMethod == VerificationMethod.ClientOnly, "Not client-only verification");
        require(milestone.autoApprovalEnabled, "Auto-approval not enabled");
        require(
            block.timestamp >= milestone.submissionTime + defaultAutoApprovalDelay,
            "Auto-approval delay not met"
        );
        require(disputes[_milestoneId].status == DisputeStatus.None, "Milestone disputed");

        milestone.status = MilestoneStatus.Approved;
        milestone.approvalTime = block.timestamp;
        milestone.qualityScore = uint8(minAutoApprovalScore); // Default score for auto-approval

        emit MilestoneApproved(_milestoneId, block.timestamp, true);
        emit AutomatedApproval(_milestoneId, milestone.qualityScore, block.timestamp);
        
        // Process payment
        _completeMilestone(_milestoneId);
    }

    /**
     * @dev Batch auto-approve eligible milestones
     */
    function batchAutoApprove(uint256[] calldata _milestoneIds) external whenNotPaused {
        for (uint256 i = 0; i < _milestoneIds.length; i++) {
            uint256 milestoneId = _milestoneIds[i];
            Milestone storage milestone = milestones[milestoneId];
            
            if (
                milestone.status == MilestoneStatus.Submitted &&
                milestone.verificationMethod == VerificationMethod.ClientOnly &&
                milestone.autoApprovalEnabled &&
                block.timestamp >= milestone.submissionTime + defaultAutoApprovalDelay &&
                disputes[milestoneId].status == DisputeStatus.None
            ) {
                milestone.status = MilestoneStatus.Approved;
                milestone.approvalTime = block.timestamp;
                milestone.qualityScore = uint8(minAutoApprovalScore);

                emit MilestoneApproved(milestoneId, block.timestamp, true);
                emit AutomatedApproval(milestoneId, milestone.qualityScore, block.timestamp);
                
                _completeMilestone(milestoneId);
            }
        }
    }

    /**
     * @dev Raise a dispute
     */
    function raiseDispute(uint256 _milestoneId, string memory _reason) external onlyProjectParties(milestones[_milestoneId].projectId) whenNotPaused {
        Milestone storage milestone = milestones[_milestoneId];
        require(
            milestone.status == MilestoneStatus.Submitted || milestone.status == MilestoneStatus.Approved,
            "Invalid milestone status for dispute"
        );
        require(disputes[_milestoneId].status == DisputeStatus.None, "Dispute already exists");
        require(bytes(_reason).length > 0, "Reason required");

        // Check dispute window for approved milestones
        if (milestone.status == MilestoneStatus.Approved) {
            require(
                block.timestamp <= milestone.approvalTime + disputeWindow,
                "Dispute window expired"
            );
        }

        milestone.status = MilestoneStatus.Disputed;
        
        Dispute storage dispute = disputes[_milestoneId];
        dispute.milestoneId = _milestoneId;
        dispute.initiator = msg.sender;
        dispute.reason = _reason;
        dispute.status = DisputeStatus.Raised;
        dispute.createdAt = block.timestamp;

        emit DisputeRaised(_milestoneId, msg.sender, _reason);
    }

    /**
     * @dev Resolve dispute (owner only)
     */
    function resolveDispute(
        uint256 _milestoneId,
        bool _clientFavor,
        string memory _resolution
    ) external onlyOwner whenNotPaused nonReentrant {
        Dispute storage dispute = disputes[_milestoneId];
        require(dispute.status == DisputeStatus.Raised, "No active dispute");

        Milestone storage milestone = milestones[_milestoneId];
        dispute.status = DisputeStatus.Resolved;
        dispute.resolvedAt = block.timestamp;
        dispute.resolver = msg.sender;
        dispute.clientFavor = _clientFavor;
        dispute.resolution = _resolution;

        if (_clientFavor) {
            // Refund to client
            milestone.status = MilestoneStatus.Cancelled;
            require(
                paymentToken.transfer(milestone.client, milestone.amount),
                "Refund transfer failed"
            );
            emit FundsWithdrawn(milestone.client, milestone.amount);
        } else {
            // Pay freelancer
            milestone.status = MilestoneStatus.Approved;
            milestone.approvalTime = block.timestamp;
            milestone.qualityScore = 100; // Assume full quality when dispute resolved in freelancer's favor
            _completeMilestone(_milestoneId);
        }

        emit DisputeResolved(_milestoneId, msg.sender, _clientFavor, _resolution);
    }

    /**
     * @dev Internal function to complete milestone and process payment
     */
    function _completeMilestone(uint256 _milestoneId) internal {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Approved, "Milestone not approved");

        milestone.status = MilestoneStatus.Completed;

        // Update project completed budget
        Project storage project = projects[milestone.projectId];
        project.completedBudget += milestone.amount;

        // Calculate platform fee
        uint256 platformFeeAmount = (milestone.amount * project.platformFee) / 10000;
        uint256 freelancerPayment = milestone.amount - platformFeeAmount;

        // Transfer payments
        if (platformFeeAmount > 0) {
            require(
                paymentToken.transfer(platformWallet, platformFeeAmount),
                "Platform fee transfer failed"
            );
        }

        require(
            paymentToken.transfer(milestone.freelancer, freelancerPayment),
            "Freelancer payment failed"
        );

        emit MilestoneCompleted(_milestoneId, freelancerPayment, platformFeeAmount);
    }

    /**
     * @dev Cancel milestone (only if not submitted)
     */
    function cancelMilestone(uint256 _milestoneId) external onlyClient(_milestoneId) whenNotPaused nonReentrant {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Created, "Cannot cancel submitted milestone");

        milestone.status = MilestoneStatus.Cancelled;

        // Refund client
        require(
            paymentToken.transfer(milestone.client, milestone.amount),
            "Refund transfer failed"
        );

        emit FundsWithdrawn(milestone.client, milestone.amount);
    }

    /**
     * @dev Configure automation for a project
     */
    function configureAutomation(
        uint256 _projectId,
        bool _enabled,
        uint256 _checkInterval,
        uint256 _autoApprovalDelay,
        uint256 _minQualityScore
    ) external onlyProjectParties(_projectId) whenNotPaused {
        require(projects[_projectId].defaultVerificationMethod == VerificationMethod.ClientOnly, "Only for client-only verification");
        
        AutomationConfig storage automation = projectAutomation[_projectId];
        automation.enabled = _enabled;
        automation.checkInterval = _checkInterval;
        automation.autoApprovalDelay = _autoApprovalDelay;
        automation.minQualityScore = _minQualityScore;
        automation.lastCheckTime = block.timestamp;

        if (_enabled && !isProjectAutomated[_projectId]) {
            automatedProjects.push(_projectId);
            isProjectAutomated[_projectId] = true;
        }

        emit AutomationConfigured(_projectId, _enabled, _checkInterval, _autoApprovalDelay);
    }

    /**
     * @dev Pause/unpause project
     */
    function pauseProject(uint256 _projectId, bool _paused) external onlyProjectParties(_projectId) {
        projects[_projectId].paused = _paused;
    }

    /**
     * @dev Get milestones eligible for auto-approval
     */
    function getEligibleMilestones() external view returns (uint256[] memory) {
        uint256[] memory eligible = new uint256[](1000); // Temporary array
        uint256 count = 0;

        for (uint256 i = 1; i < nextMilestoneId && count < 1000; i++) {
            Milestone memory milestone = milestones[i];
            if (
                milestone.status == MilestoneStatus.Submitted &&
                milestone.verificationMethod == VerificationMethod.ClientOnly &&
                milestone.autoApprovalEnabled &&
                block.timestamp >= milestone.submissionTime + defaultAutoApprovalDelay &&
                disputes[i].status == DisputeStatus.None
            ) {
                eligible[count] = i;
                count++;
            }
        }

        // Create properly sized array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = eligible[i];
        }

        return result;
    }

    // View functions
    function getProject(uint256 _projectId) external view returns (Project memory) {
        return projects[_projectId];
    }

    function getMilestone(uint256 _milestoneId) external view returns (Milestone memory) {
        return milestones[_milestoneId];
    }

    function getDispute(uint256 _milestoneId) external view returns (Dispute memory) {
        return disputes[_milestoneId];
    }

    function getProjectMilestones(uint256 _projectId) external view returns (uint256[] memory) {
        return projectMilestones[_projectId];
    }

    function getClientProjects(address _client) external view returns (uint256[] memory) {
        return clientProjects[_client];
    }

    function getFreelancerProjects(address _freelancer) external view returns (uint256[] memory) {
        return freelancerProjects[_freelancer];
    }

    function getAutomatedProjects() external view returns (uint256[] memory) {
        return automatedProjects;
    }

    function getProjectAutomation(uint256 _projectId) external view returns (AutomationConfig memory) {
        return projectAutomation[_projectId];
    }

    // Admin functions
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        defaultPlatformFee = _newFee;
    }

    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid wallet address");
        platformWallet = _newWallet;
    }

    function updateDisputeWindow(uint256 _newWindow) external onlyOwner {
        disputeWindow = _newWindow;
    }

    function updateAutoApprovalDelay(uint256 _newDelay) external onlyOwner {
        defaultAutoApprovalDelay = _newDelay;
    }

    function updateMinAutoApprovalScore(uint256 _newScore) external onlyOwner {
        require(_newScore <= 100, "Score too high");
        minAutoApprovalScore = _newScore;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit ContractPaused(_paused);
    }

    function updateAutomationRegistry(address _newRegistry) external onlyOwner {
        automationRegistry = _newRegistry;
    }

    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        MyToken token = MyToken(_token);
        require(token.transfer(owner, _amount), "Emergency withdraw failed");
    }

    // Gas optimization: Pack multiple milestone checks in one call
    function checkMultipleMilestones(uint256[] calldata _milestoneIds) external view returns (bool[] memory canAutoApprove) {
        canAutoApprove = new bool[](_milestoneIds.length);
        
        for (uint256 i = 0; i < _milestoneIds.length; i++) {
            uint256 milestoneId = _milestoneIds[i];
            Milestone memory milestone = milestones[milestoneId];
            
            canAutoApprove[i] = (
                milestone.status == MilestoneStatus.Submitted &&
                milestone.verificationMethod == VerificationMethod.ClientOnly &&
                milestone.autoApprovalEnabled &&
                block.timestamp >= milestone.submissionTime + defaultAutoApprovalDelay &&
                disputes[milestoneId].status == DisputeStatus.None
            );
        }
    }
}
