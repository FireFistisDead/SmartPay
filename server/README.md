# SmartPay Backend

A comprehensive Node.js backend system for a Freelance Escrow Smart Contract platform that automates payments for freelancers upon milestone completion.

## Features

### Core Functionality
- **Blockchain Integration**: Smart contract event listening and transaction processing using ethers.js v6
- **IPFS Storage**: Decentralized file storage with Web3.Storage and Pinata redundancy
- **Job Management**: Complete job lifecycle management with milestone-based payments
- **User Authentication**: JWT-based authentication with Ethereum signature verification
- **Dispute Resolution**: Comprehensive dispute handling with arbiter system
- **Real-time Updates**: WebSocket support for live notifications

### Technical Stack
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for performance optimization
- **Blockchain**: ethers.js for Ethereum interaction
- **Storage**: IPFS (Web3.Storage + Pinata)
- **Authentication**: JWT with crypto signature verification
- **Real-time**: Socket.io for WebSocket communication

## Architecture

```
src/
├── config/           # Configuration files
│   ├── config.js     # Environment configuration
│   ├── database.js   # MongoDB connection
│   └── redis.js      # Redis client setup
├── controllers/      # Business logic controllers
│   ├── analyticsController.js
│   ├── disputeController.js
│   ├── ipfsController.js
│   ├── jobController.js
│   ├── milestoneController.js
│   └── userController.js
├── middleware/       # Express middleware
│   ├── auth.js       # Authentication & authorization
│   ├── errorHandler.js
│   └── validation.js
├── models/           # MongoDB schemas
│   ├── Event.js      # Blockchain events
│   ├── Job.js        # Job/project data
│   └── User.js       # User profiles
├── routes/           # API route definitions
│   ├── analyticsRoutes.js
│   ├── disputeRoutes.js
│   ├── ipfsRoutes.js
│   ├── jobRoutes.js
│   ├── milestoneRoutes.js
│   └── userRoutes.js
├── services/         # External service integrations
│   ├── blockchainEventListener.js
│   ├── ipfsService.js
│   └── notificationService.js
├── utils/            # Utility functions
│   ├── helpers.js
│   └── logger.js
└── server.js         # Main application entry point
```

## API Endpoints

### Authentication
- `POST /api/users/auth/nonce` - Get authentication nonce
- `POST /api/users/auth/login` - Login with signature
- `POST /api/users/register` - Register new user

### User Management
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `GET /api/users/:address` - Get user by address
- `GET /api/users` - Get users with filtering
- `POST /api/users/me/skills` - Add skill to profile
- `DELETE /api/users/me/skills/:skillName` - Remove skill

### Job Management
- `POST /api/jobs` - Create new job
- `GET /api/jobs` - Get jobs with filtering
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `POST /api/jobs/:id/apply` - Apply for job
- `POST /api/jobs/:id/assign` - Assign freelancer

### Milestone Management
- `GET /api/milestones/job/:jobId` - Get job milestones
- `POST /api/milestones/job/:jobId/:milestoneIndex/submit` - Submit deliverable
- `POST /api/milestones/job/:jobId/:milestoneIndex/approve` - Approve milestone
- `GET /api/milestones/pending` - Get pending milestones
- `GET /api/milestones/stats` - Get milestone statistics

### Dispute Management
- `POST /api/disputes/job/:jobId/raise` - Raise dispute
- `GET /api/disputes` - Get disputes with filtering
- `GET /api/disputes/:disputeId` - Get dispute details
- `POST /api/disputes/:disputeId/respond` - Respond to dispute
- `POST /api/disputes/:disputeId/resolve` - Resolve dispute (arbiter)

### IPFS Storage
- `POST /api/ipfs/upload` - Upload file to IPFS
- `POST /api/ipfs/upload/multiple` - Upload multiple files
- `GET /api/ipfs/:hash` - Get file from IPFS
- `POST /api/ipfs/pin/:hash` - Pin file to IPFS
- `DELETE /api/ipfs/unpin/:hash` - Unpin file from IPFS

### Analytics
- `GET /api/analytics/platform` - Platform-wide statistics
- `GET /api/analytics/jobs` - Job analytics
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/disputes` - Dispute analytics
- `GET /api/analytics/earnings` - Earnings analytics (freelancers)
- `GET /api/analytics/spending` - Spending analytics (clients)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartPay/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/smartpay
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Blockchain
   RPC_URL=https://your-ethereum-rpc-url
   CONTRACT_ADDRESS=0x...
   PRIVATE_KEY=your-private-key
   
   # IPFS
   WEB3_STORAGE_TOKEN=your-web3-storage-token
   PINATA_API_KEY=your-pinata-api-key
   PINATA_SECRET_KEY=your-pinata-secret-key
   
   # Email (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   - Install and start MongoDB
   - Install and start Redis
   - The application will create necessary collections automatically

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Key Features

### Blockchain Event Listening
The system automatically listens for smart contract events and updates the database accordingly:
- Job creation events
- Milestone completion events
- Payment events
- Dispute events

### IPFS Integration
Redundant file storage with multiple providers:
- Primary: Web3.Storage
- Backup: Pinata
- Automatic failover and retry mechanisms

### Authentication System
Secure authentication using Ethereum signatures:
- Nonce-based signature verification
- JWT token management
- Role-based access control

### Dispute Resolution
Comprehensive dispute handling:
- Evidence submission and storage
- Arbiter assignment
- Resolution tracking
- Appeal process

### Real-time Notifications
WebSocket-based real-time updates:
- Job status changes
- Milestone submissions
- Dispute notifications
- Payment confirmations

## Security Features

- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation using express-validator
- **Security Headers**: Helmet.js for security headers
- **CORS Configuration**: Properly configured CORS policies
- **Error Handling**: Secure error handling without information leakage

## Performance Optimization

- **Redis Caching**: Aggressive caching of frequently accessed data
- **Database Indexing**: Optimized MongoDB indexes
- **Response Compression**: Gzip compression for API responses
- **Query Optimization**: Efficient database queries with population control

## Monitoring and Logging

- **Winston Logger**: Comprehensive logging system
- **Health Checks**: System health monitoring endpoints
- **Error Tracking**: Detailed error logging and tracking
- **Performance Metrics**: Built-in performance monitoring

## Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Database Migrations
```bash
npm run migrate
```

### API Documentation
The API is documented using OpenAPI/Swagger specifications. Access the documentation at:
```
http://localhost:5000/api-docs
```

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t smartpay-backend .

# Run container
docker run -p 5000:5000 --env-file .env smartpay-backend
```

### Production Considerations
- Use PM2 for process management
- Set up reverse proxy with Nginx
- Configure SSL certificates
- Set up monitoring with tools like New Relic or DataDog
- Configure automated backups for MongoDB and Redis

## Smart Contract Integration

The backend is designed to work with the SmartPay smart contract. Key integration points:

1. **Event Listening**: Automatically processes contract events
2. **Transaction Handling**: Manages transaction submissions and confirmations
3. **State Synchronization**: Keeps database in sync with blockchain state
4. **Gas Optimization**: Intelligent gas price management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## Roadmap

- [ ] GraphQL API implementation
- [ ] Enhanced analytics dashboard
- [ ] Multi-chain support
- [ ] Advanced dispute resolution AI
- [ ] Performance optimization phase 2
- [ ] Mobile API optimizations
