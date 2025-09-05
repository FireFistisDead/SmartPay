// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SmartPay is ReentrancyGuard, Ownable {
    struct Payment {
        address payer;
        address payee;
        uint256 amount;
        address token;
        uint256 timestamp;
        bool completed;
        bool cancelled;
    }
    
    struct RecurringPayment {
        address payer;
        address payee;
        uint256 amount;
        address token;
        uint256 interval; // in seconds
        uint256 nextPayment;
        bool active;
        uint256 paymentsCount;
    }
    
    mapping(uint256 => Payment) public payments;
    mapping(uint256 => RecurringPayment) public recurringPayments;
    mapping(address => uint256[]) public userPayments;
    mapping(address => uint256[]) public userRecurringPayments;
    
    uint256 public paymentCounter;
    uint256 public recurringPaymentCounter;
    uint256 public platformFee = 25; // 0.25% (25/10000)
    address public feeRecipient;
    
    event PaymentCreated(uint256 indexed paymentId, address indexed payer, address indexed payee, uint256 amount, address token);
    event PaymentCompleted(uint256 indexed paymentId);
    event PaymentCancelled(uint256 indexed paymentId);
    event RecurringPaymentCreated(uint256 indexed recurringId, address indexed payer, address indexed payee, uint256 amount, address token, uint256 interval);
    event RecurringPaymentExecuted(uint256 indexed recurringId, uint256 paymentNumber);
    event RecurringPaymentCancelled(uint256 indexed recurringId);
    
    constructor(address initialOwner) Ownable(initialOwner) {
        feeRecipient = initialOwner;
    }
    
    function createPayment(
        address payee,
        uint256 amount,
        address token
    ) external nonReentrant returns (uint256) {
        require(payee != address(0), "Invalid payee address");
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");
        
        uint256 paymentId = paymentCounter++;
        
        payments[paymentId] = Payment({
            payer: msg.sender,
            payee: payee,
            amount: amount,
            token: token,
            timestamp: block.timestamp,
            completed: false,
            cancelled: false
        });
        
        userPayments[msg.sender].push(paymentId);
        userPayments[payee].push(paymentId);
        
        emit PaymentCreated(paymentId, msg.sender, payee, amount, token);
        return paymentId;
    }
    
    function executePayment(uint256 paymentId) external nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.payer == msg.sender, "Only payer can execute");
        require(!payment.completed, "Payment already completed");
        require(!payment.cancelled, "Payment cancelled");
        
        IERC20 token = IERC20(payment.token);
        uint256 fee = (payment.amount * platformFee) / 10000;
        uint256 netAmount = payment.amount - fee;
        
        require(token.transferFrom(msg.sender, payment.payee, netAmount), "Transfer to payee failed");
        if (fee > 0) {
            require(token.transferFrom(msg.sender, feeRecipient, fee), "Fee transfer failed");
        }
        
        payment.completed = true;
        emit PaymentCompleted(paymentId);
    }
    
    function cancelPayment(uint256 paymentId) external {
        Payment storage payment = payments[paymentId];
        require(payment.payer == msg.sender, "Only payer can cancel");
        require(!payment.completed, "Payment already completed");
        require(!payment.cancelled, "Payment already cancelled");
        
        payment.cancelled = true;
        emit PaymentCancelled(paymentId);
    }
    
    function createRecurringPayment(
        address payee,
        uint256 amount,
        address token,
        uint256 interval
    ) external returns (uint256) {
        require(payee != address(0), "Invalid payee address");
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");
        require(interval > 0, "Interval must be greater than 0");
        
        uint256 recurringId = recurringPaymentCounter++;
        
        recurringPayments[recurringId] = RecurringPayment({
            payer: msg.sender,
            payee: payee,
            amount: amount,
            token: token,
            interval: interval,
            nextPayment: block.timestamp + interval,
            active: true,
            paymentsCount: 0
        });
        
        userRecurringPayments[msg.sender].push(recurringId);
        userRecurringPayments[payee].push(recurringId);
        
        emit RecurringPaymentCreated(recurringId, msg.sender, payee, amount, token, interval);
        return recurringId;
    }
    
    function executeRecurringPayment(uint256 recurringId) external nonReentrant {
        RecurringPayment storage recurring = recurringPayments[recurringId];
        require(recurring.active, "Recurring payment not active");
        require(block.timestamp >= recurring.nextPayment, "Payment not due yet");
        
        IERC20 token = IERC20(recurring.token);
        uint256 fee = (recurring.amount * platformFee) / 10000;
        uint256 netAmount = recurring.amount - fee;
        
        require(token.transferFrom(recurring.payer, recurring.payee, netAmount), "Transfer to payee failed");
        if (fee > 0) {
            require(token.transferFrom(recurring.payer, feeRecipient, fee), "Fee transfer failed");
        }
        
        recurring.nextPayment = block.timestamp + recurring.interval;
        recurring.paymentsCount++;
        
        emit RecurringPaymentExecuted(recurringId, recurring.paymentsCount);
    }
    
    function cancelRecurringPayment(uint256 recurringId) external {
        RecurringPayment storage recurring = recurringPayments[recurringId];
        require(recurring.payer == msg.sender, "Only payer can cancel");
        require(recurring.active, "Recurring payment already inactive");
        
        recurring.active = false;
        emit RecurringPaymentCancelled(recurringId);
    }
    
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFee = newFee;
    }
    
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient address");
        feeRecipient = newRecipient;
    }
    
    function getUserPayments(address user) external view returns (uint256[] memory) {
        return userPayments[user];
    }
    
    function getUserRecurringPayments(address user) external view returns (uint256[] memory) {
        return userRecurringPayments[user];
    }
}
