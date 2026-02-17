# SmartPay - Decentralized Freelance Marketplace 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.8-blue)](https://soliditylang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)](https://www.mongodb.com/)

SmartPay revolutionizes the freelance marketplace by leveraging blockchain technology for secure, transparent, and decentralized task management and payments.

## ✨ Features

- 🔐 **Blockchain-Powered**: Ethereum smart contracts ensure secure and transparent transactions
- 💼 **Task Management**: Create, assign, and complete tasks with automated payment escrow
- 🎨 **Multiple Categories**: Design (Logo, UI/UX, Web) and Development (Full-stack, Web)
- ⭐ **Review System**: Rate and review completed work
- 👤 **User Profiles**: Manage your profile, credits, and task history
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

## 📁 Project Structure

```
SmartPay/
├── frontend/          # Next.js 14 application
├── backend/           # Express.js API with MongoDB
├── contracts/         # Solidity smart contracts (Hardhat)
└── SmartPay-demo/    # Demo version (no crypto required!)
```

## 🎯 Two Versions Available

### 1. **Production SmartPay** (This Directory)
- Full blockchain integration
- Requires MetaMask wallet
- Real cryptocurrency transactions (3 ETH per task)
- Permanent blockchain storage

### 2. **SmartPay-demo** (Demo Directory)
- **No wallet required!**
- **No crypto needed!**
- FREE task creation
- Perfect for testing and demonstrations
- [See Demo Documentation](SmartPay-demo/README.md)

## 🚀 Tech Stack

## 🚀 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- ethers.js for blockchain interaction
- MetaMask integration

**Backend:**
- Express.js 4
- MongoDB with Mongoose
- RESTful API
- File upload support

**Blockchain:**
- Solidity 0.8.8
- Hardhat development environment
- Ethereum smart contracts

## ⚡ Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB
- MetaMask browser extension

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Path3010/SmartPay.git
cd SmartPay
```

2. **Create environment files**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
cp contracts/.env.example contracts/.env
```

3. **Install dependencies**
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Contracts
cd ../contracts && npm install
```

4. **Start MongoDB** (if not running)
```bash
# Using Docker
docker run -d --name smartpay-mongo -p 27017:27017 mongo:6

# Or use local MongoDB installation
```

5. **Run the services**
```bash
# Terminal 1 - Backend
cd backend && npm start    # http://localhost:8080

# Terminal 2 - Frontend  
cd frontend && npm run dev # http://localhost:3000
```

6. **Open the app**
- Navigate to http://localhost:3000
- Connect your MetaMask wallet
- Start creating tasks!

## 🎭 Try Demo Version (No Crypto Required!)

Want to test without cryptocurrency? Check out the demo version:

```bash
cd SmartPay-demo
# See SmartPay-demo/QUICKSTART.md for setup
```

**Demo Features:**
- ✅ FREE task creation
- ✅ No wallet needed
- ✅ All UI/UX features
- ✅ Perfect for presentations

[📖 Demo Documentation](SmartPay-demo/README.md)

## 🔧 Environment Variables

### Backend (backend/.env)
```env
MONGODB_URL=mongodb://127.0.0.1:27017/smartpay
PORT=8080
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Frontend (frontend/.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Contracts (contracts/.env)
```env
PRIVATE_KEY=your-private-key
INFURA_PROJECT_ID=your-infura-id
```

## 📖 How It Works

1. **Create Task**: Post a task with reward (costs 3 ETH)
2. **Browse Tasks**: Freelancers browse available tasks
3. **Request Task**: Solvers request to work on tasks
4. **Assign Task**: Creator assigns task to a solver
5. **Complete Task**: Solver completes and submits work
6. **Release Payment**: Creator approves and releases payment
7. **Review**: Both parties can leave reviews

## 🎨 Features in Detail

### Task Management
- Create tasks with detailed descriptions
- Set rewards in ETH
- Specify time to complete
- Choose from multiple categories
- Track task status (Created, Assigned, Completed, Accepted)

### Payment System
- Escrow-based payments
- Automated fund transfers via smart contracts
- Secure blockchain transactions
- Credit system for task creation

### User System
- Profile management
- Task history
- Review and rating system
- Credit balance tracking

## 🛠️ Development

### Smart Contract Deployment
```bash
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network localhost
```

### Run Tests
```bash
# Backend tests (if available)
cd backend && npm test

# Contract tests
cd contracts && npx hardhat test
```

## 📁 Key Directories

- `frontend/src/app` - Next.js app router pages
- `frontend/src/components` - Reusable React components
- `frontend/src/hooks` - Custom React hooks for blockchain
- `frontend/src/utils` - Utility functions and contract interactions
- `backend/src/models` - MongoDB schemas
- `backend/src/controllers` - Express route handlers
- `backend/src/routes` - API route definitions
- `contracts/contracts` - Solidity smart contracts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Demo Version**: [SmartPay-demo](SmartPay-demo/)
- **GitHub**: [https://github.com/Path3010/SmartPay](https://github.com/Path3010/SmartPay)

## ⚠️ Important Notes

- This is a demo/educational project
- Use testnet for testing (never mainnet with real funds during development)
- Always audit smart contracts before production deployment
- Demo version in `SmartPay-demo/` doesn't require crypto - perfect for testing!

---

**Made with ❤️ using Next.js, Express, and Solidity**
- frontend/.env.local
  - NEXT_PUBLIC_BACKEND_URL: Base URL for the Express API (e.g. <http://localhost:8080>)
- contracts/.env
  - SEPOLIA_RPC_URL, MUMBAI_RPC_URL: RPC URLs for deployments
  - PRIVATE_KEY: Wallet private key for deployments
  - ETHERSCAN_API_KEY, COINMARKETCAP_API_KEY: Optional verification and gas price APIs

## API Surface

- GET /user/:walletAddress — fetch user profile
- POST /user/insertProfile — create profile
- POST /user/update — update profile fields
- POST /user/updatecredits — adjust credit balance
- POST /user/reviews/:projectAddress/:userid — add a review
- GET /reviews/:projectAddress — list reviews for a project
- GET /submission/:projectAddress — list submissions for a project
- POST /user/insertSubmission — create or update a submission link
- PUT /submission/:id/:type/:current — upvote/downvote a submission

## Smart Contracts

- Current deployed addresses
  - Mumbai: 0x84322cC07D2014D958A19bA1b6E93788FC9F9608
  - Sepolia: 0x4ed96a857fc902e79b7d9551034c3efa0a369b60
- ABI and contract address used by the frontend live in frontend/config/config.json
- Compile/export artifacts

```bash
npm run compile-export --prefix contracts
```

## Notes

- Default ports: API 8080, frontend 3000. Update the env files to change them.
- Ensure MetaMask is connected to the network that matches the contract address in frontend/config/config.json.
- Static assets and mock data live under frontend/public and frontend/public/data.

