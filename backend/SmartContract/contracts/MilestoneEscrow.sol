// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract MilestoneEscrow is ReentrancyGuard, Ownable, Pausable {
    
    enum MilestoneStatus {
        Pending,        // Milestone created but not started
        InProgress,     // Freelancer is working on it
        Submitted,      // Freelancer submitted work for review
        Approved,       // Client approved the milestone
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
    
    struct Milestone {
        uint256 id;
        string description;
        uint256 amount;
        uint256 deadline;
        MilestoneStatus status;
        string submissionHash; // IPFS hash or URL of submitted work
        uint256 submittedAt;
        uint256 approvedAt;
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
    }
    
    struct Dispute {
        uint256 jobId;
        uint256 milestoneId;
        address initiator;
        string reason;
        bool resolved;
        address winner; // address(0) if not resolved
        uint256 createdAt;
    }
    
    // State variables
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public freelancerJobs;
    
    uint256 public jobCounter;
    uint256 public disputeCounter;
    uint256 public defaultPlatformFee = 250; // 2.5% in basis points
    uint256 public disputeWindow = 7 days; // Time window to raise disputes
    address public feeRecipient;
    address public disputeResolver; // Address authorized to resolve disputes
    
    // Events
    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed freelancer,
        uint256 totalAmount,
        uint256 milestonesCount
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
    
    event MilestoneApproved(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed client
    );
    
    event PaymentReleased(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed freelancer,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address initiator
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        address indexed winner,
        uint256 compensation
    );
    
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
    
    modifier jobExists(uint256 _jobId) {
        require(_jobId < jobCounter, "Job does not exist");
        _;
    }
    
    modifier validMilestone(uint256 _jobId, uint256 _milestoneId) {
        require(_milestoneId < jobs[_jobId].milestones.length, "Invalid milestone ID");
        _;
    }
    
    constructor(address _feeRecipient, address _disputeResolver) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        disputeResolver = _disputeResolver;
    }
    
    /**
     * @dev Create a new job with milestones
     * @param _freelancer Address of the freelancer
     * @param _paymentToken Token to be used for payments
     * @param _milestoneDescriptions Array of milestone descriptions
     * @param _milestoneAmounts Array of milestone amounts
     * @param _milestoneDeadlines Array of milestone deadlines
     */
    function createJob(
        address _freelancer,
        address _paymentToken,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts,
        uint256[] memory _milestoneDeadlines
    ) external whenNotPaused returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_freelancer != msg.sender, "Client cannot be freelancer");
        require(_paymentToken != address(0), "Invalid payment token");
        require(_milestoneDescriptions.length > 0, "At least one milestone required");
        require(
            _milestoneDescriptions.length == _milestoneAmounts.length &&
            _milestoneAmounts.length == _milestoneDeadlines.length,
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
                approvedAt: 0
            }));
            
            totalAmount += _milestoneAmounts[i];
        }
        
        newJob.totalAmount = totalAmount;
        
        clientJobs[msg.sender].push(jobId);
        freelancerJobs[_freelancer].push(jobId);
        
        emit JobCreated(jobId, msg.sender, _freelancer, totalAmount, _milestoneDescriptions.length);
        
        return jobId;
    }
    
    /**
     * @dev Client deposits funds for the job
     * @param _jobId ID of the job
     */
    function depositFunds(uint256 _jobId) 
        external 
        nonReentrant 
        whenNotPaused 
        jobExists(_jobId) 
        onlyClient(_jobId) 
    {
        Job storage job = jobs[_jobId];
        require(!job.fundsDeposited, "Funds already deposited");
        require(job.status == JobStatus.Active, "Job is not active");
        
        IERC20 token = IERC20(job.paymentToken);
        uint256 feeAmount = (job.totalAmount * job.platformFee) / 10000;
        uint256 totalRequired = job.totalAmount + feeAmount;
        
        require(
            token.transferFrom(msg.sender, address(this), totalRequired),
            "Failed to transfer funds"
        );
        
        job.fundsDeposited = true;
        
        emit FundsDeposited(_jobId, totalRequired);
    }
    
    /**
     * @dev Freelancer starts working on a milestone
     * @param _jobId ID of the job
     * @param _milestoneId ID of the milestone
     */
    function startMilestone(uint256 _jobId, uint256 _milestoneId)
        external
        whenNotPaused
        jobExists(_jobId)
        validMilestone(_jobId, _milestoneId)
        onlyFreelancer(_jobId)
    {
        Job storage job = jobs[_jobId];
        require(job.fundsDeposited, "Funds not deposited yet");
        require(job.status == JobStatus.Active, "Job is not active");
        
        Milestone storage milestone = job.milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Pending, "Milestone already started");
        
        milestone.status = MilestoneStatus.InProgress;
        
        emit MilestoneStarted(_jobId, _milestoneId, msg.sender);
    }
    
    /**
     * @dev Freelancer submits work for a milestone
     * @param _jobId ID of the job
     * @param _milestoneId ID of the milestone
     * @param _submissionHash IPFS hash or URL of the submitted work
     */
    function submitMilestone(
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
        
        emit MilestoneSubmitted(_jobId, _milestoneId, _submissionHash);
    }
    
    /**
     * @dev Client approves a milestone and releases payment
     * @param _jobId ID of the job
     * @param _milestoneId ID of the milestone
     */
    function approveMilestone(uint256 _jobId, uint256 _milestoneId)
        external
        nonReentrant
        whenNotPaused
        jobExists(_jobId)
        validMilestone(_jobId, _milestoneId)
        onlyClient(_jobId)
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Active, "Job is not active");
        
        Milestone storage milestone = job.milestones[_milestoneId];
        require(
            milestone.status == MilestoneStatus.Submitted,
            "Milestone not submitted yet"
        );
        
        milestone.status = MilestoneStatus.Approved;
        milestone.approvedAt = block.timestamp;
        
        // Release payment to freelancer
        _releaseMilestonePayment(_jobId, _milestoneId);
        
        emit MilestoneApproved(_jobId, _milestoneId, msg.sender);
        
        // Check if all milestones are completed
        _checkJobCompletion(_jobId);
    }
    
    /**
     * @dev Raise a dispute for a milestone
     * @param _jobId ID of the job
     * @param _milestoneId ID of the milestone
     * @param _reason Reason for the dispute
     */
    function raiseDispute(
        uint256 _jobId,
        uint256 _milestoneId,
        string memory _reason
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
            milestone.status == MilestoneStatus.InProgress,
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
            createdAt: block.timestamp
        });
        
        milestone.status = MilestoneStatus.Disputed;
        job.status = JobStatus.Disputed;
        
        emit DisputeRaised(disputeId, _jobId, _milestoneId, msg.sender);
    }
    
    /**
     * @dev Resolve a dispute (only dispute resolver can call)
     * @param _disputeId ID of the dispute
     * @param _winner Address of the winning party
     */
    function resolveDispute(uint256 _disputeId, address _winner)
        external
        nonReentrant
        whenNotPaused
    {
        require(msg.sender == disputeResolver, "Only dispute resolver can resolve");
        require(_disputeId < disputeCounter, "Dispute does not exist");
        
        Dispute storage dispute = disputes[_disputeId];
        require(!dispute.resolved, "Dispute already resolved");
        
        Job storage job = jobs[dispute.jobId];
        Milestone storage milestone = job.milestones[dispute.milestoneId];
        
        require(_winner == job.client || _winner == job.freelancer, "Invalid winner");
        
        dispute.resolved = true;
        dispute.winner = _winner;
        
        if (_winner == job.freelancer) {
            milestone.status = MilestoneStatus.Approved;
            _releaseMilestonePayment(dispute.jobId, dispute.milestoneId);
        } else {
            milestone.status = MilestoneStatus.Cancelled;
            // Funds remain in escrow for client to withdraw
        }
        
        job.status = JobStatus.Active;
        
        emit DisputeResolved(_disputeId, _winner, milestone.amount);
        
        _checkJobCompletion(dispute.jobId);
    }
    
    /**
     * @dev Cancel job and refund client (only if no milestones started)
     * @param _jobId ID of the job
     */
    function cancelJob(uint256 _jobId)
        external
        nonReentrant
        whenNotPaused
        jobExists(_jobId)
        onlyClient(_jobId)
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Active, "Job is not active");
        require(job.fundsDeposited, "No funds to refund");
        
        // Check if any milestone has been started
        for (uint256 i = 0; i < job.milestones.length; i++) {
            require(
                job.milestones[i].status == MilestoneStatus.Pending,
                "Cannot cancel job with started milestones"
            );
        }
        
        job.status = JobStatus.Cancelled;
        
        // Refund client
        IERC20 token = IERC20(job.paymentToken);
        uint256 feeAmount = (job.totalAmount * job.platformFee) / 10000;
        uint256 refundAmount = job.totalAmount + feeAmount;
        
        require(token.transfer(job.client, refundAmount), "Refund failed");
        
        emit JobCancelled(_jobId);
    }
    
    /**
     * @dev Internal function to release milestone payment
     */
    function _releaseMilestonePayment(uint256 _jobId, uint256 _milestoneId) internal {
        Job storage job = jobs[_jobId];
        Milestone storage milestone = job.milestones[_milestoneId];
        
        milestone.status = MilestoneStatus.Completed;
        
        IERC20 token = IERC20(job.paymentToken);
        uint256 feeAmount = (milestone.amount * job.platformFee) / 10000;
        uint256 freelancerAmount = milestone.amount - feeAmount;
        
        require(token.transfer(job.freelancer, freelancerAmount), "Payment to freelancer failed");
        require(token.transfer(feeRecipient, feeAmount), "Fee transfer failed");
        
        emit PaymentReleased(_jobId, _milestoneId, job.freelancer, freelancerAmount);
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
    
    // View functions
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
    
    function getClientJobs(address _client) external view returns (uint256[] memory) {
        return clientJobs[_client];
    }
    
    function getFreelancerJobs(address _freelancer) external view returns (uint256[] memory) {
        return freelancerJobs[_freelancer];
    }
    
    function getJobMilestonesCount(uint256 _jobId) external view returns (uint256) {
        return jobs[_jobId].milestones.length;
    }
    
    // Admin functions
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        defaultPlatformFee = _newFee;
    }
    
    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
    }
    
    function setDisputeResolver(address _newResolver) external onlyOwner {
        require(_newResolver != address(0), "Invalid resolver");
        disputeResolver = _newResolver;
    }
    
    function setDisputeWindow(uint256 _newWindow) external onlyOwner {
        require(_newWindow >= 1 days && _newWindow <= 30 days, "Invalid dispute window");
        disputeWindow = _newWindow;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency function to withdraw funds (only owner, only when paused)
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner whenPaused {
        IERC20(_token).transfer(owner(), _amount);
    }
}
