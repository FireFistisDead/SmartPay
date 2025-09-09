# SmartPay - Decentralized Freelance Work Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)](https://www.typescriptlang.org/)

> **SmartPay** is a revolutionary decentralized freelance platform that automates milestone-based payments using blockchain smart contracts, ensuring trust, transparency, and security for both clients and freelancers.

## 🌟 Features

- **🔗 Blockchain Integration**: Automated payments via smart contracts
- **💼 Dual Role System**: Separate dashboards for clients and freelancers  
- **📊 Milestone Management**: Track project progress with escrow protection
- **🔒 Dispute Resolution**: Oracle-based conflict resolution system
- **🎨 Modern UI/UX**: Futuristic design with animations and micro-interactions
- **📱 Responsive Design**: Mobile-first approach with adaptive layouts
- **🌙 Dark/Light Mode**: Theme switching with smooth transitions

## 🏗️ Architecture

```
SmartPay/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages/routes
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions and configs
├── server/                 # Express.js backend
├── shared/                 # Shared schemas and types
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)
- **MetaMask** or compatible Web3 wallet

### 1. Clone the Repository

```bash
# Clone the project
git clone https://github.com/FireFistisDead/SmartPay.git

# Navigate to project directory
cd SmartPay

# Switch to your development branch (replace 'YourName' with your actual branch)
git checkout YourName
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Or using yarn
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="your_database_connection_string"

# Blockchain Configuration  
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/your-api-key"
PRIVATE_KEY="your_wallet_private_key_for_deployment"

# Session Configuration
SESSION_SECRET="your_session_secret_key"

# Development
NODE_ENV="development"
PORT=3000
```

### 4. Database Setup

```bash
# Push database schema (using Drizzle ORM)
npm run db:push
```

### 5. Start Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production version |
| `npm run start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## 🧪 Technology Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **Wouter** - Lightweight routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **Passport.js** - Authentication
- **WebSocket** - Real-time communication

### Blockchain
- **Ethereum/Polygon** - Smart contract deployment
- **Solidity** - Smart contract language
- **ethers.js** - Blockchain interaction
- **IPFS** - Decentralized file storage

### Development Tools
- **ESBuild** - Fast bundler
- **Drizzle Kit** - Database migration tool
- **Cross-env** - Environment variables

## 🌐 User Roles & Features

### 👨‍💼 Client (Employer)
- Create and manage projects
- Define milestone-based payments
- Fund escrow smart contracts
- Approve/reject milestone deliverables
- Manage dispute resolution

### 👩‍💻 Freelancer (Worker)
- Browse available projects
- Submit proposals and accept contracts
- Upload milestone deliverables
- Track payment status
- Participate in dispute resolution

## 🔄 Development Workflow

### Branch Structure
- `main` - Production branch
- `Ansh` - Ansh's development branch
- `Devansh` - Devansh's development branch  
- `Harsh` - Harsh's development branch
- `Vedant` - Vedant's development branch
- `Yash` - Yash's development branch

### Working on Features

1. **Switch to your branch:**
   ```bash
   git checkout YourName
   ```

2. **Pull latest changes:**
   ```bash
   git pull origin YourName
   ```

3. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. **Push to your branch:**
   ```bash
   git push origin YourName
   ```

### Commit Message Convention
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 🎨 UI Components

The project uses a comprehensive design system built with:

- **Shadcn/ui** components for consistent styling
- **Radix UI** primitives for accessibility
- **Tailwind CSS** for responsive design
- **Framer Motion** for smooth animations
- **Lucide React** for modern icons

### Key Components
- Navigation with wallet connection
- Project cards with hover animations
- Milestone progress tracking
- Payment status indicators
- Dispute resolution interface

## 🔐 Security Features

- **Smart Contract Escrow** - Funds locked until milestone approval
- **Dispute Resolution** - Oracle-based conflict resolution
- **Wallet Authentication** - Secure Web3 login
- **Input Validation** - Zod schema validation
- **Session Management** - Secure session handling

## 📱 Responsive Design

- **Mobile-first** approach
- **Adaptive layouts** for all screen sizes
- **Touch-friendly** interactions
- **Progressive enhancement** for better performance

## 🤝 Contributing

1. **Choose your branch** based on your name
2. **Follow the coding standards:**
   - Use TypeScript for type safety
   - Follow the existing component structure
   - Write descriptive commit messages
   - Test your changes thoroughly

3. **Code Style:**
   - Use Prettier for formatting
   - Follow React best practices
   - Use meaningful variable names
   - Comment complex logic

## 🐛 Troubleshooting

### Common Issues

**Node modules issues:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
# Run type checking
npm run check
```

**Database connection issues:**
```bash
# Check your DATABASE_URL in .env
# Run database push again
npm run db:push
```

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
```

## 📞 Support

- **GitHub Issues**: [Create an issue](https://github.com/FireFistisDead/SmartPay/issues)
- **Team Communication**: Use your preferred team chat platform
- **Documentation**: Check the `/docs` folder for detailed guides

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Coding! 🚀**

Built with ❤️ by the SmartPay team
