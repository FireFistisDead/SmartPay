// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MyToken.sol";

/**
 * @title MilestoneEscrow
 * @dev Simplified milestone escrow without automation
 * @dev Manual client approval system with basic dispute resolution
 */
contract MilestoneEscrow {
    enum MilestoneStatus { Created, Submitted, Approved, Disputed, Completed, Cancelled }
    enum DisputeStatus { None, Raised, UnderReview, Resolved }

    struct Milestone {
        uint256 id;
        uint256 projectId;
        address freelancer;
        address client;
        uint256 amount;
        string description;
        string deliverableHash; // IPFS hash or other identifier
        uint256 deadline;
        MilestoneStatus status;
        uint256 submissionTime;
        uint256 approvalTime;
    }

    struct Dispute {
        uint256 milestoneId;
        address initiator;
        string reason;
        DisputeStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
        address resolver;
        bool clientFavor; // true if resolved in client's favor
    }

    struct Project {
        uint256 id;
        address client;
        address freelancer;
        string title;
        string description;
        uint256 totalBudget;
        uint256 platformFee; // percentage in basis points (100 = 1%)
        bool active;
        uint256 createdAt;
    }

    MyToken public paymentToken;
    address public owner;
    address public platformWallet;
    uint256 public defaultPlatformFee = 250; // 2.5%
    uint256 public disputeWindow = 7 days;
    uint256 public autoApprovalDelay = 14 days;

    uint256 private nextProjectId = 1;
    uint256 private nextMilestoneId = 1;

    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256[]) public projectMilestones; // projectId => milestoneIds
    mapping(address => uint256[]) public clientProjects;
    mapping(address => uint256[]) public freelancerProjects;

    // Events
    event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed freelancer, uint256 totalBudget);
    event MilestoneCreated(uint256 indexed milestoneId, uint256 indexed projectId, uint256 amount, string description);
    event MilestoneSubmitted(uint256 indexed milestoneId, string deliverableHash, uint256 submissionTime);
    event MilestoneApproved(uint256 indexed milestoneId, uint256 approvalTime);
    event MilestoneCompleted(uint256 indexed milestoneId, uint256 paymentAmount, uint256 platformFee);
    event DisputeRaised(uint256 indexed milestoneId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed milestoneId, address indexed resolver, bool clientFavor);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
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

    constructor(address _paymentToken, address _platformWallet) {
        paymentToken = MyToken(_paymentToken);
        owner = msg.sender;
        platformWallet = _platformWallet;
    }

    /**
     * @dev Create a new project
     */
    function createProject(
        address _freelancer,
        string memory _title,
        string memory _description,
        uint256 _totalBudget
    ) external returns (uint256) {
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
        project.active = true;
        project.createdAt = block.timestamp;

        clientProjects[msg.sender].push(projectId);
        freelancerProjects[_freelancer].push(projectId);

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
        uint256 _deadline
    ) external onlyProjectParties(_projectId) returns (uint256) {
        require(projects[_projectId].active, "Project not active");
        require(_amount > 0, "Amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in future");

        uint256 milestoneId = nextMilestoneId++;
        
        Milestone storage milestone = milestones[milestoneId];
        milestone.id = milestoneId;
        milestone.projectId = _projectId;
        milestone.freelancer = projects[_projectId].freelancer;
        milestone.client = projects[_projectId].client;
        milestone.amount = _amount;
        milestone.description = _description;
        milestone.deadline = _deadline;
        milestone.status = MilestoneStatus.Created;

        projectMilestones[_projectId].push(milestoneId);

        // Transfer funds to escrow
        require(
            paymentToken.transferFrom(milestone.client, address(this), _amount),
            "Payment transfer failed"
        );

        emit MilestoneCreated(milestoneId, _projectId, _amount, _description);
        return milestoneId;
    }

    /**
     * @dev Submit milestone deliverable
     */
    function submitMilestone(
        uint256 _milestoneId,
        string memory _deliverableHash
    ) external onlyFreelancer(_milestoneId) {
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
     * @dev Approve milestone (client only)
     */
    function approveMilestone(uint256 _milestoneId) external onlyClient(_milestoneId) {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Submitted, "Milestone not submitted");

        milestone.status = MilestoneStatus.Approved;
        milestone.approvalTime = block.timestamp;

        emit MilestoneApproved(_milestoneId, block.timestamp);
        
        // Process payment
        _completeMilestone(_milestoneId);
    }

    /**
     * @dev Auto-approve milestone after delay period
     */
    function autoApproveMilestone(uint256 _milestoneId) external {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Submitted, "Milestone not submitted");
        require(
            block.timestamp >= milestone.submissionTime + autoApprovalDelay,
            "Auto-approval delay not met"
        );
        require(disputes[_milestoneId].status == DisputeStatus.None, "Milestone disputed");

        milestone.status = MilestoneStatus.Approved;
        milestone.approvalTime = block.timestamp;

        emit MilestoneApproved(_milestoneId, block.timestamp);
        
        // Process payment
        _completeMilestone(_milestoneId);
    }

    /**
     * @dev Raise a dispute
     */
    function raiseDispute(uint256 _milestoneId, string memory _reason) external onlyProjectParties(milestones[_milestoneId].projectId) {
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
    function resolveDispute(uint256 _milestoneId, bool _clientFavor) external onlyOwner {
        Dispute storage dispute = disputes[_milestoneId];
        require(dispute.status == DisputeStatus.Raised, "No active dispute");

        Milestone storage milestone = milestones[_milestoneId];
        dispute.status = DisputeStatus.Resolved;
        dispute.resolvedAt = block.timestamp;
        dispute.resolver = msg.sender;
        dispute.clientFavor = _clientFavor;

        if (_clientFavor) {
            // Refund to client
            milestone.status = MilestoneStatus.Cancelled;
            require(
                paymentToken.transfer(milestone.client, milestone.amount),
                "Refund transfer failed"
            );
        } else {
            // Pay freelancer
            milestone.status = MilestoneStatus.Approved;
            milestone.approvalTime = block.timestamp;
            _completeMilestone(_milestoneId);
        }

        emit DisputeResolved(_milestoneId, msg.sender, _clientFavor);
    }

    /**
     * @dev Internal function to complete milestone and process payment
     */
    function _completeMilestone(uint256 _milestoneId) internal {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Approved, "Milestone not approved");

        milestone.status = MilestoneStatus.Completed;

        // Calculate platform fee
        uint256 platformFeeAmount = (milestone.amount * projects[milestone.projectId].platformFee) / 10000;
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
    function cancelMilestone(uint256 _milestoneId) external onlyClient(_milestoneId) {
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
        autoApprovalDelay = _newDelay;
    }
}
