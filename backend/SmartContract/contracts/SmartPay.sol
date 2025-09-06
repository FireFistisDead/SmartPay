// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MyToken.sol";

/**
 * @title SmartPay
 * @dev Handle general one-time and recurring payments
 */
contract SmartPay {
    enum PaymentType { OneTime, Recurring }
    enum PaymentStatus { Pending, Completed, Cancelled, Failed }

    struct Payment {
        uint256 id;
        address payer;
        address payee;
        uint256 amount;
        PaymentType paymentType;
        PaymentStatus status;
        uint256 createdAt;
        uint256 executedAt;
        string description;
        bytes32 externalRef; // External reference for tracking
    }

    struct RecurringPayment {
        uint256 id;
        address payer;
        address payee;
        uint256 amount;
        uint256 interval; // seconds between payments
        uint256 startTime;
        uint256 endTime; // 0 for indefinite
        uint256 lastExecuted;
        uint256 totalExecutions;
        uint256 maxExecutions; // 0 for unlimited
        PaymentStatus status;
        string description;
    }

    MyToken public paymentToken;
    address public owner;
    address public platformWallet;
    uint256 public platformFee = 100; // 1% in basis points

    uint256 private nextPaymentId = 1;
    uint256 private nextRecurringId = 1;

    mapping(uint256 => Payment) public payments;
    mapping(uint256 => RecurringPayment) public recurringPayments;
    mapping(address => uint256[]) public userPayments;
    mapping(address => uint256[]) public userRecurringPayments;

    // Events
    event PaymentCreated(uint256 indexed paymentId, address indexed payer, address indexed payee, uint256 amount);
    event PaymentExecuted(uint256 indexed paymentId, uint256 amount, uint256 platformFee);
    event PaymentCancelled(uint256 indexed paymentId);
    event RecurringPaymentCreated(uint256 indexed recurringId, address indexed payer, address indexed payee, uint256 amount, uint256 interval);
    event RecurringPaymentExecuted(uint256 indexed recurringId, uint256 executionNumber, uint256 amount);
    event RecurringPaymentStopped(uint256 indexed recurringId, uint256 totalExecutions);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyPayer(uint256 _paymentId) {
        require(msg.sender == payments[_paymentId].payer, "Not payer");
        _;
    }

    modifier onlyRecurringPayer(uint256 _recurringId) {
        require(msg.sender == recurringPayments[_recurringId].payer, "Not payer");
        _;
    }

    constructor(address _paymentToken, address _platformWallet) {
        paymentToken = MyToken(_paymentToken);
        owner = msg.sender;
        platformWallet = _platformWallet;
    }

    /**
     * @dev Create a one-time payment
     */
    function createPayment(
        address _payee,
        uint256 _amount,
        string memory _description,
        bytes32 _externalRef
    ) external returns (uint256) {
        require(_payee != address(0), "Invalid payee address");
        require(_payee != msg.sender, "Cannot pay yourself");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 paymentId = nextPaymentId++;
        
        Payment storage payment = payments[paymentId];
        payment.id = paymentId;
        payment.payer = msg.sender;
        payment.payee = _payee;
        payment.amount = _amount;
        payment.paymentType = PaymentType.OneTime;
        payment.status = PaymentStatus.Pending;
        payment.createdAt = block.timestamp;
        payment.description = _description;
        payment.externalRef = _externalRef;

        userPayments[msg.sender].push(paymentId);
        userPayments[_payee].push(paymentId);

        emit PaymentCreated(paymentId, msg.sender, _payee, _amount);
        return paymentId;
    }

    /**
     * @dev Execute a one-time payment
     */
    function executePayment(uint256 _paymentId) external onlyPayer(_paymentId) {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Pending, "Payment not pending");

        // Calculate platform fee
        uint256 platformFeeAmount = (payment.amount * platformFee) / 10000;
        uint256 payeeAmount = payment.amount - platformFeeAmount;

        // Transfer tokens from payer to contract first
        require(
            paymentToken.transferFrom(msg.sender, address(this), payment.amount),
            "Payment transfer failed"
        );

        // Transfer platform fee
        if (platformFeeAmount > 0) {
            require(
                paymentToken.transfer(platformWallet, platformFeeAmount),
                "Platform fee transfer failed"
            );
        }

        // Transfer payment to payee
        require(
            paymentToken.transfer(payment.payee, payeeAmount),
            "Payee transfer failed"
        );

        payment.status = PaymentStatus.Completed;
        payment.executedAt = block.timestamp;

        emit PaymentExecuted(_paymentId, payeeAmount, platformFeeAmount);
    }

    /**
     * @dev Cancel a pending payment
     */
    function cancelPayment(uint256 _paymentId) external onlyPayer(_paymentId) {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Pending, "Payment not pending");

        payment.status = PaymentStatus.Cancelled;
        emit PaymentCancelled(_paymentId);
    }

    /**
     * @dev Create a recurring payment
     */
    function createRecurringPayment(
        address _payee,
        uint256 _amount,
        uint256 _interval,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxExecutions,
        string memory _description
    ) external returns (uint256) {
        require(_payee != address(0), "Invalid payee address");
        require(_payee != msg.sender, "Cannot pay yourself");
        require(_amount > 0, "Amount must be greater than 0");
        require(_interval > 0, "Interval must be greater than 0");
        require(_startTime >= block.timestamp, "Start time must be in future");
        require(_endTime == 0 || _endTime > _startTime, "Invalid end time");

        uint256 recurringId = nextRecurringId++;
        
        RecurringPayment storage recurring = recurringPayments[recurringId];
        recurring.id = recurringId;
        recurring.payer = msg.sender;
        recurring.payee = _payee;
        recurring.amount = _amount;
        recurring.interval = _interval;
        recurring.startTime = _startTime;
        recurring.endTime = _endTime;
        recurring.lastExecuted = 0;
        recurring.totalExecutions = 0;
        recurring.maxExecutions = _maxExecutions;
        recurring.status = PaymentStatus.Pending;
        recurring.description = _description;

        userRecurringPayments[msg.sender].push(recurringId);
        userRecurringPayments[_payee].push(recurringId);

        emit RecurringPaymentCreated(recurringId, msg.sender, _payee, _amount, _interval);
        return recurringId;
    }

    /**
     * @dev Execute a recurring payment
     */
    function executeRecurringPayment(uint256 _recurringId) external {
        RecurringPayment storage recurring = recurringPayments[_recurringId];
        require(recurring.status == PaymentStatus.Pending, "Recurring payment not active");
        require(block.timestamp >= recurring.startTime, "Not started yet");
        
        // Check if it's time for next execution
        if (recurring.lastExecuted > 0) {
            require(
                block.timestamp >= recurring.lastExecuted + recurring.interval,
                "Too early for next payment"
            );
        }

        // Check end time
        if (recurring.endTime > 0) {
            require(block.timestamp <= recurring.endTime, "Recurring payment expired");
        }

        // Check max executions
        if (recurring.maxExecutions > 0) {
            require(recurring.totalExecutions < recurring.maxExecutions, "Max executions reached");
        }

        // Calculate platform fee
        uint256 platformFeeAmount = (recurring.amount * platformFee) / 10000;
        uint256 payeeAmount = recurring.amount - platformFeeAmount;

        // Transfer tokens from payer
        require(
            paymentToken.transferFrom(recurring.payer, address(this), recurring.amount),
            "Payment transfer failed"
        );

        // Transfer platform fee
        if (platformFeeAmount > 0) {
            require(
                paymentToken.transfer(platformWallet, platformFeeAmount),
                "Platform fee transfer failed"
            );
        }

        // Transfer payment to payee
        require(
            paymentToken.transfer(recurring.payee, payeeAmount),
            "Payee transfer failed"
        );

        recurring.lastExecuted = block.timestamp;
        recurring.totalExecutions++;

        // Check if this was the last execution
        if (recurring.maxExecutions > 0 && recurring.totalExecutions >= recurring.maxExecutions) {
            recurring.status = PaymentStatus.Completed;
            emit RecurringPaymentStopped(_recurringId, recurring.totalExecutions);
        }

        emit RecurringPaymentExecuted(_recurringId, recurring.totalExecutions, payeeAmount);
    }

    /**
     * @dev Stop a recurring payment
     */
    function stopRecurringPayment(uint256 _recurringId) external onlyRecurringPayer(_recurringId) {
        RecurringPayment storage recurring = recurringPayments[_recurringId];
        require(recurring.status == PaymentStatus.Pending, "Recurring payment not active");

        recurring.status = PaymentStatus.Cancelled;
        emit RecurringPaymentStopped(_recurringId, recurring.totalExecutions);
    }

    /**
     * @dev Check if recurring payment is due
     */
    function isRecurringPaymentDue(uint256 _recurringId) external view returns (bool) {
        RecurringPayment memory recurring = recurringPayments[_recurringId];
        
        if (recurring.status != PaymentStatus.Pending) return false;
        if (block.timestamp < recurring.startTime) return false;
        if (recurring.endTime > 0 && block.timestamp > recurring.endTime) return false;
        if (recurring.maxExecutions > 0 && recurring.totalExecutions >= recurring.maxExecutions) return false;
        
        if (recurring.lastExecuted == 0) return true;
        return block.timestamp >= recurring.lastExecuted + recurring.interval;
    }

    /**
     * @dev Batch execute multiple recurring payments
     */
    function batchExecuteRecurringPayments(uint256[] calldata _recurringIds) external {
        for (uint256 i = 0; i < _recurringIds.length; i++) {
            if (this.isRecurringPaymentDue(_recurringIds[i])) {
                this.executeRecurringPayment(_recurringIds[i]);
            }
        }
    }

    // View functions
    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    function getRecurringPayment(uint256 _recurringId) external view returns (RecurringPayment memory) {
        return recurringPayments[_recurringId];
    }

    function getUserPayments(address _user) external view returns (uint256[] memory) {
        return userPayments[_user];
    }

    function getUserRecurringPayments(address _user) external view returns (uint256[] memory) {
        return userRecurringPayments[_user];
    }

    function getNextPaymentTime(uint256 _recurringId) external view returns (uint256) {
        RecurringPayment memory recurring = recurringPayments[_recurringId];
        if (recurring.lastExecuted == 0) {
            return recurring.startTime;
        }
        return recurring.lastExecuted + recurring.interval;
    }

    // Admin functions
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _newFee;
    }

    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid wallet address");
        platformWallet = _newWallet;
    }

    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        MyToken token = MyToken(_token);
        require(token.transfer(owner, _amount), "Emergency withdraw failed");
    }
}
