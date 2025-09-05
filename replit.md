# Overview

This is SmartPay, a modern React web application for a decentralized freelance work platform that automates milestone-based payments using blockchain smart contracts. The platform connects clients and freelancers through a trustless system that handles escrow payments, project milestones, and automated fund releases using blockchain technology.

The application features a futuristic design with blockchain-inspired visuals, glassmorphism effects, and animated user interfaces. It showcases the platform's key benefits including automated payments, dispute resolution, and decentralized trust mechanisms through an engaging marketing website.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built with React 18 and TypeScript, utilizing Vite as the build tool and development server. The architecture follows a component-based design pattern with:

- **UI Framework**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with custom design tokens for blockchain-themed aesthetics
- **Animations**: Framer Motion for smooth transitions and parallax effects
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **Type Safety**: Full TypeScript implementation with strict type checking

## Backend Architecture
The server uses Express.js with TypeScript in ESM module format. The architecture includes:

- **Server Framework**: Express.js with middleware for request logging and error handling
- **Development Tools**: Custom Vite integration for hot reloading in development
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development
- **Route Structure**: Modular route registration with API prefix organization

## Data Storage Solutions
The application uses a flexible storage architecture:

- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL configured for production use
- **Development Storage**: In-memory storage implementation for local development
- **Migration System**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless PostgreSQL driver

## Authentication and Authorization
The current implementation includes a basic user schema foundation:

- **User Management**: User entity with username and password fields
- **Session Handling**: Express session configuration ready for implementation
- **Validation**: Zod schema validation for user input
- **Security**: Password hashing and secure session management capabilities

## External Dependencies

### Database and ORM
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations and migrations
- **connect-pg-simple**: PostgreSQL session store for Express

### UI and Design System
- **Radix UI**: Comprehensive primitive component library
- **shadcn/ui**: Pre-built component library with Tailwind CSS
- **Framer Motion**: Advanced animation and gesture library
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### State Management and Data Fetching
- **TanStack React Query**: Server state management and caching
- **Wouter**: Lightweight routing solution
- **React Hook Form**: Form state management with validation

### Blockchain and Web3 Integration
The application is designed to integrate with blockchain technologies for:
- Smart contract interactions for escrow payments
- Cryptocurrency payment processing
- Decentralized identity management
- Oracle-based dispute resolution systems

The current implementation provides the foundation for these blockchain features while maintaining a clean separation of concerns between the traditional web application stack and future Web3 integrations.