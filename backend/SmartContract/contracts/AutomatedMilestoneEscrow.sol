// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Chainlink imports for automation and oracles
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract AutomatedMilestoneEscrow is ReentrancyGuard, Ownable, Pausable, AutomationCompatibleInterface {
    
    enum MilestoneStatus {
        Pending,        // Milestone created but not started
        InProgress,     // Freelancer is working on it
        Submitted,      // Freelancer submitted work for review
        AutoVerified,   // Automatically verified by oracle/system
        ClientApproved, // Manually approved by client
        Disputed,       // Either party raised a dispute
        Completed,      // Payment released to freelancer
        Cancelled       // Milestone cancelled, funds returned
    }
    
    enum JobStatus {
        Active,
        Completed,
        Cancelled,
        Disputed
    }
    
    enum VerificationMethod {
        ClientOnly,     // Only client can approve
        OracleOnly,     // Only oracle/automation can approve
        Hybrid,         // Either client or oracle can approve
        OffChainVerifier // Off-chain backend verifier
    }
    
    struct Milestone {
        uint256 id;
        string description;
        uint256 amount;
        uint256 deadline;
        MilestoneStatus status;
        string submissionHash; // IPFS hash or URL of submitted work
        uint256 submittedAt;
        uint256 approvedAt;
        VerificationMethod verificationMethod;
        string verificationCriteria; // JSON string with criteria for automation
        uint256 autoApprovalDelay; // Time delay before auto-approval (if applicable)
    }
    
    struct Job {
        uint256 id;
        address client;
        address freelancer;
        address paymentToken;
        uint256 totalAmount;
        uint256 platformFee; // Fee percentage (basis points: 250 = 2.5%)
        JobStatus status;
        uint256 createdAt;
        uint256 disputeDeadline; // Deadline for raising disputes
        bool fundsDeposited;
        Milestone[] milestones;
        string metadataHash; // IPFS hash for job metadata
    }
    
    struct Dispute {
        uint256 jobId;
        uint256 milestoneId;
        address initiator;
        string reason;
        bool resolved;
        address winner; // address(0) if not resolved
        uint256 createdAt;
        string evidenceHash; // IPFS hash for dispute evidence
    }
    
    struct OffChainVerifier {
        address verifierAddress;
        string verifierName;
        bool isActive;
        uint256 reputation; // 0-100 scale
    }
    
    // State variables
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public freelancerJobs;
    mapping(address => OffChainVerifier) public offChainVerifiers;
    mapping(uint256 => mapping(uint256 => bool)) public pendingAutoApprovals; // jobId => milestoneId => pending
    
    uint256 public jobCounter;
    uint256 public disputeCounter;
    uint256 public defaultPlatformFee = 250; // 2.5% in basis points
    uint256 public disputeWindow = 7 days; // Time window to raise disputes
    uint256 public defaultAutoApprovalDelay = 48 hours; // Default delay for auto-approval
    address public feeRecipient;
    address public disputeResolver; // Address authorized to resolve disputes
    
    // Oracle and automation
    AggregatorV3Interface public priceFeed; // For USD price conversions if needed
    uint256 public lastUpkeepTimestamp;
    uint256 public upkeepInterval = 1 hours; // Check every hour
    
    // Events
    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed freelancer,
        uint256 totalAmount,
        uint256 milestonesCount,
        string metadataHash
    );
    
    event FundsDeposited(uint256 indexed jobId, uint256 amount);
    
    event MilestoneStarted(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed freelancer
    );
    
    event MilestoneSubmitted(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        string submissionHash
    );
    
    event MilestoneAutoApproved(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        string reason
    );
    
    event MilestoneClientApproved(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed client
    );
    
    event MilestoneOracleVerified(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed oracle
    );
    
    event PaymentReleased(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed freelancer,
        uint256 amount,
        string approvalMethod
    );
    
    event DisputeRaised(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address initiator,
        string evidenceHash
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        address indexed winner,
        uint256 compensation
    );
    
    event OffChainVerifierAdded(address indexed verifier, string name);
    event OffChainVerifierUpdated(address indexed verifier, bool isActive, uint256 reputation);
    
    event JobCompleted(uint256 indexed jobId);
    event JobCancelled(uint256 indexed jobId);
    
    // Modifiers
    modifier onlyJobParticipant(uint256 _jobId) {
        Job storage job = jobs[_jobId];
        require(
            msg.sender == job.client || msg.sender == job.freelancer,
            "Not authorized for this job"
        );
        _;
    }
    
    modifier onlyClient(uint256 _jobId) {
        require(jobs[_jobId].client == msg.sender, "Only client can call this");
        _;
    }
    
    modifier onlyFreelancer(uint256 _jobId) {
        require(jobs[_jobId].freelancer == msg.sender, "Only freelancer can call this");
        _;
    }
    
    modifier onlyOffChainVerifier() {
        require(offChainVerifiers[msg.sender].isActive, "Not an active off-chain verifier");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(_jobId < jobCounter, "Job does not exist");
        _;
    }
    
    modifier validMilestone(uint256 _jobId, uint256 _milestoneId) {
        require(_milestoneId < jobs[_jobId].milestones.length, "Invalid milestone ID");
        _;
    }
    
    constructor(address _feeRecipient, address _disputeResolver, address _priceFeed) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        disputeResolver = _disputeResolver;
        priceFeed = AggregatorV3Interface(_priceFeed);
        lastUpkeepTimestamp = block.timestamp;
    }
    
    /**
     * @dev Create a new job with automated milestone verification
     */
    function createJobWithAutomation(
        address _freelancer,
        address _paymentToken,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts,
        uint256[] memory _milestoneDeadlines,
        VerificationMethod[] memory _verificationMethods,
        string[] memory _verificationCriteria,
        uint256[] memory _autoApprovalDelays,
        string memory _metadataHash
    ) external whenNotPaused returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_freelancer != msg.sender, "Client cannot be freelancer");
        require(_paymentToken != address(0), "Invalid payment token");
        require(_milestoneDescriptions.length > 0, "At least one milestone required");
        require(
            _milestoneDescriptions.length == _milestoneAmounts.length &&
            _milestoneAmounts.length == _milestoneDeadlines.length &&
            _milestoneDeadlines.length == _verificationMethods.length &&
            _verificationMethods.length == _verificationCriteria.length &&
            _verificationCriteria.length == _autoApprovalDelays.length,
            "Milestone arrays length mismatch"
        );
        
        uint256 jobId = jobCounter++;
        Job storage newJob = jobs[jobId];
        
        newJob.id = jobId;
        newJob.client = msg.sender;
        newJob.freelancer = _freelancer;
        newJob.paymentToken = _paymentToken;
        newJob.platformFee = defaultPlatformFee;
        newJob.status = JobStatus.Active;
        newJob.createdAt = block.timestamp;
        newJob.disputeDeadline = block.timestamp + disputeWindow;
        newJob.metadataHash = _metadataHash;
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            require(_milestoneAmounts[i] > 0, "Milestone amount must be positive");
            require(_milestoneDeadlines[i] > block.timestamp, "Deadline must be in future");
            
            newJob.milestones.push(Milestone({
                id: i,
                description: _milestoneDescriptions[i],
                amount: _milestoneAmounts[i],
                deadline: _milestoneDeadlines[i],
                status: MilestoneStatus.Pending,
                submissionHash: "",
                submittedAt: 0,
                approvedAt: 0,
                verificationMethod: _verificationMethods[i],
                verificationCriteria: _verificationCriteria[i],
                autoApprovalDelay: _autoApprovalDelays[i] > 0 ? _autoApprovalDelays[i] : defaultAutoApprovalDelay
            }));
            
            totalAmount += _milestoneAmounts[i];
        }
        
        newJob.totalAmount = totalAmount;
        
        clientJobs[msg.sender].push(jobId);
        freelancerJobs[_freelancer].push(jobId);
        
        emit JobCreated(jobId, msg.sender, _freelancer, totalAmount, _milestoneDescriptions.length, _metadataHash);
        
        return jobId;
    }
    
    /**
     * @dev Freelancer submits work with automatic verification trigger
     */
    function submitMilestoneWithAutoVerification(
        uint256 _jobId, 
        uint256 _milestoneId, 
        string memory _submissionHash
    )
        external
        whenNotPaused
        jobExists(_jobId)
        validMilestone(_jobId, _milestoneId)
        onlyFreelancer(_jobId)
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Active, "Job is not active");
        
        Milestone storage milestone = job.milestones[_milestoneId];
        require(
            milestone.status == MilestoneStatus.InProgress,
            "Milestone not in progress"
        );
        require(bytes(_submissionHash).length > 0, "Submission hash required");
        
        milestone.status = MilestoneStatus.Submitted;
        milestone.submissionHash = _submissionHash;
        milestone.submittedAt = block.timestamp;
        
        // If oracle-only or hybrid verification, mark for auto-approval
        if (milestone.verificationMethod == VerificationMethod.OracleOnly ||
            milestone.verificationMethod == VerificationMethod.Hybrid) {
            pendingAutoApprovals[_jobId][_milestoneId] = true;
        }
        
        emit MilestoneSubmitted(_jobId, _milestoneId, _submissionHash);
    }
    
    /**
     * @dev Off-chain verifier approves milestone
     */
    function offChainVerifierApprove(
        uint256 _jobId,
        uint256 _milestoneId,
        string memory _verificationReport
    )
        external
        nonReentrant
        whenNotPaused
        jobExists(_jobId)
        validMilestone(_jobId, _milestoneId)
        onlyOffChainVerifier
    {
        Job storage job = jobs[_jobId];
        Milestone storage milestone = job.milestones[_milestoneId];
        
        require(job.status == JobStatus.Active, "Job is not active");
        require(milestone.status == MilestoneStatus.Submitted, "Milestone not submitted");
        require(
            milestone.verificationMethod == VerificationMethod.OffChainVerifier ||
            milestone.verificationMethod == VerificationMethod.Hybrid,
            "Invalid verification method for off-chain verifier"
        );
        
        milestone.status = MilestoneStatus.AutoVerified;
        milestone.approvedAt = block.timestamp;
        
        _releaseMilestonePayment(_jobId, _milestoneId, "OffChainVerifier");
        
        emit MilestoneOracleVerified(_jobId, _milestoneId, msg.sender);
        _checkJobCompletion(_jobId);
    }
    
    /**
     * @dev Chainlink Automation upkeep check
     */
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastUpkeepTimestamp) > upkeepInterval;
        
        if (upkeepNeeded) {
            // Find milestones ready for auto-approval
            uint256[] memory readyJobs = new uint256[](100); // Max 100 jobs to process
            uint256[] memory readyMilestones = new uint256[](100);
            uint256 count = 0;
            
            for (uint256 jobId = 0; jobId < jobCounter && count < 100; jobId++) {
                Job storage job = jobs[jobId];
                if (job.status == JobStatus.Active) {
                    for (uint256 milestoneId = 0; milestoneId < job.milestones.length && count < 100; milestoneId++) {
                        Milestone storage milestone = job.milestones[milestoneId];
                        
                        if (pendingAutoApprovals[jobId][milestoneId] &&
                            milestone.status == MilestoneStatus.Submitted &&
                            block.timestamp >= milestone.submittedAt + milestone.autoApprovalDelay) {
                            
                            readyJobs[count] = jobId;
                            readyMilestones[count] = milestoneId;
                            count++;
                        }
                    }
                }
            }
            
            if (count > 0) {
                // Trim arrays to actual size
                uint256[] memory jobsToProcess = new uint256[](count);
                uint256[] memory milestonesToProcess = new uint256[](count);
                
                for (uint256 i = 0; i < count; i++) {
                    jobsToProcess[i] = readyJobs[i];
                    milestonesToProcess[i] = readyMilestones[i];
                }
                
                performData = abi.encode(jobsToProcess, milestonesToProcess);
            }
        }
    }
    
    /**
     * @dev Chainlink Automation upkeep execution
     */
    function performUpkeep(bytes calldata performData) external override {
        lastUpkeepTimestamp = block.timestamp;
        
        if (performData.length > 0) {
            (uint256[] memory jobIds, uint256[] memory milestoneIds) = abi.decode(performData, (uint256[], uint256[]));
            
            for (uint256 i = 0; i < jobIds.length; i++) {
                uint256 jobId = jobIds[i];
                uint256 milestoneId = milestoneIds[i];
                
                if (pendingAutoApprovals[jobId][milestoneId]) {
                    _autoApproveMilestone(jobId, milestoneId);
                }
            }
        }
    }
    
    /**
     * @dev Internal function to auto-approve milestone
     */
    function _autoApproveMilestone(uint256 _jobId, uint256 _milestoneId) internal {
        Job storage job = jobs[_jobId];
        Milestone storage milestone = job.milestones[_milestoneId];
        
        if (milestone.status == MilestoneStatus.Submitted &&
            block.timestamp >= milestone.submittedAt + milestone.autoApprovalDelay) {
            
            milestone.status = MilestoneStatus.AutoVerified;
            milestone.approvedAt = block.timestamp;
            pendingAutoApprovals[_jobId][_milestoneId] = false;
            
            _releaseMilestonePayment(_jobId, _milestoneId, "AutoApproval");
            
            emit MilestoneAutoApproved(_jobId, _milestoneId, "Time-based auto-approval");
            _checkJobCompletion(_jobId);
        }
    }
    
    /**
     * @dev Add off-chain verifier
     */
    function addOffChainVerifier(
        address _verifier,
        string memory _name,
        uint256 _reputation
    ) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        require(_reputation <= 100, "Reputation must be 0-100");
        
        offChainVerifiers[_verifier] = OffChainVerifier({
            verifierAddress: _verifier,
            verifierName: _name,
            isActive: true,
            reputation: _reputation
        });
        
        emit OffChainVerifierAdded(_verifier, _name);
    }
    
    /**
     * @dev Update off-chain verifier status
     */
    function updateOffChainVerifier(
        address _verifier,
        bool _isActive,
        uint256 _reputation
    ) external onlyOwner {
        require(_reputation <= 100, "Reputation must be 0-100");
        
        OffChainVerifier storage verifier = offChainVerifiers[_verifier];
        verifier.isActive = _isActive;
        verifier.reputation = _reputation;
        
        emit OffChainVerifierUpdated(_verifier, _isActive, _reputation);
    }
    
    /**
     * @dev Enhanced dispute with evidence
     */
    function raiseDisputeWithEvidence(
        uint256 _jobId,
        uint256 _milestoneId,
        string memory _reason,
        string memory _evidenceHash
    )
        external
        whenNotPaused
        jobExists(_jobId)
        validMilestone(_jobId, _milestoneId)
        onlyJobParticipant(_jobId)
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Active, "Job is not active");
        require(block.timestamp <= job.disputeDeadline, "Dispute window expired");
        
        Milestone storage milestone = job.milestones[_milestoneId];
        require(
            milestone.status == MilestoneStatus.Submitted ||
            milestone.status == MilestoneStatus.InProgress ||
            milestone.status == MilestoneStatus.AutoVerified,
            "Invalid milestone status for dispute"
        );
        
        uint256 disputeId = disputeCounter++;
        disputes[disputeId] = Dispute({
            jobId: _jobId,
            milestoneId: _milestoneId,
            initiator: msg.sender,
            reason: _reason,
            resolved: false,
            winner: address(0),
            createdAt: block.timestamp,
            evidenceHash: _evidenceHash
        });
        
        milestone.status = MilestoneStatus.Disputed;
        job.status = JobStatus.Disputed;
        
        // Cancel pending auto-approval
        pendingAutoApprovals[_jobId][_milestoneId] = false;
        
        emit DisputeRaised(disputeId, _jobId, _milestoneId, msg.sender, _evidenceHash);
    }
    
    /**
     * @dev Internal function to release milestone payment with method tracking
     */
    function _releaseMilestonePayment(uint256 _jobId, uint256 _milestoneId, string memory _approvalMethod) internal {
        Job storage job = jobs[_jobId];
        Milestone storage milestone = job.milestones[_milestoneId];
        
        milestone.status = MilestoneStatus.Completed;
        
        IERC20 token = IERC20(job.paymentToken);
        uint256 feeAmount = (milestone.amount * job.platformFee) / 10000;
        uint256 freelancerAmount = milestone.amount - feeAmount;
        
        require(token.transfer(job.freelancer, freelancerAmount), "Payment to freelancer failed");
        require(token.transfer(feeRecipient, feeAmount), "Fee transfer failed");
        
        emit PaymentReleased(_jobId, _milestoneId, job.freelancer, freelancerAmount, _approvalMethod);
    }
    
    /**
     * @dev Internal function to check if job is completed
     */
    function _checkJobCompletion(uint256 _jobId) internal {
        Job storage job = jobs[_jobId];
        
        bool allCompleted = true;
        for (uint256 i = 0; i < job.milestones.length; i++) {
            if (job.milestones[i].status != MilestoneStatus.Completed &&
                job.milestones[i].status != MilestoneStatus.Cancelled) {
                allCompleted = false;
                break;
            }
        }
        
        if (allCompleted) {
            job.status = JobStatus.Completed;
            emit JobCompleted(_jobId);
        }
    }
    
    // View functions (keeping existing ones and adding new)
    function getJob(uint256 _jobId) external view returns (Job memory) {
        return jobs[_jobId];
    }
    
    function getMilestone(uint256 _jobId, uint256 _milestoneId) 
        external 
        view 
        returns (Milestone memory) 
    {
        return jobs[_jobId].milestones[_milestoneId];
    }
    
    function isPendingAutoApproval(uint256 _jobId, uint256 _milestoneId) 
        external 
        view 
        returns (bool) 
    {
        return pendingAutoApprovals[_jobId][_milestoneId];
    }
    
    function getOffChainVerifier(address _verifier) 
        external 
        view 
        returns (OffChainVerifier memory) 
    {
        return offChainVerifiers[_verifier];
    }
    
    // Admin functions
    function setUpkeepInterval(uint256 _newInterval) external onlyOwner {
        require(_newInterval >= 10 minutes, "Interval too short");
        upkeepInterval = _newInterval;
    }
    
    function setDefaultAutoApprovalDelay(uint256 _newDelay) external onlyOwner {
        require(_newDelay >= 1 hours, "Delay too short");
        defaultAutoApprovalDelay = _newDelay;
    }
    
    function setPriceFeed(address _newPriceFeed) external onlyOwner {
        priceFeed = AggregatorV3Interface(_newPriceFeed);
    }
}
