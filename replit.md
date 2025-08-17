# Personal Finance Manager - replit.md

## Overview

This is a full-stack personal finance management application built with Express.js backend and React frontend. The app allows users to track their income and expenses, set monthly targets, and view financial analytics. It features a mobile-first design with Indonesian language support and uses a private key-based authentication system.

## User Preferences

Preferred communication style: Simple, everyday language.
Migration completed: Successfully migrated from PostgreSQL to memory storage for Replit compatibility.
Chat features: WhatsApp-like interface with Wey ID system similar to BBM, includes contacts management, private messaging, and global chat.
GitHub compatibility: Project structure maintained for easy GitHub push capability.
Important: Do not remove existing features without explicit user permission.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: Memory Storage (migrated from PostgreSQL for Replit compatibility)
- **Database ORM**: Drizzle schema maintained for type safety
- **API Pattern**: RESTful API with JSON responses
- **Validation**: Zod for schema validation
- **Authentication**: Custom private key-based system with Wey ID for chat features

### Database Schema
- **Users Table**: Stores user profiles with unique private keys, monthly targets, and Wey IDs for chat
- **Transactions Table**: Stores income/expense records with categories and descriptions  
- **Contacts Table**: Stores user contacts for private messaging
- **Chat Messages Table**: Stores private messages between users
- **Global Chat Table**: Stores global chat room messages
- **Relationships**: One-to-many between users and transactions, contacts, messages

## Key Components

### Authentication System
- **Private Key Generation**: Custom SK-prefixed 32-character keys
- **Storage**: LocalStorage for client-side persistence
- **Validation**: Server-side key verification without traditional sessions
- **Flow**: Register → Generate key → Login with key

### Transaction Management
- **Categories**: Food, Transport, Shopping, Entertainment, Bills, Other
- **Types**: Income and Expense tracking
- **Features**: Quick actions, templates, real-time updates
- **Analytics**: Balance calculation, category distribution, date-range filtering

### Mobile-First Design
- **Responsive**: Tailwind breakpoints for mobile adaptation
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Offline-Ready**: LocalStorage persistence for authentication state

### Financial Analytics
- **Balance Tracking**: Real-time income/expense calculations
- **Target Progress**: Visual progress bars for monthly goals
- **Category Insights**: Spending distribution by category
- **Time-based Reports**: Daily, weekly, monthly views

### Chat Features
- **Wey Chat System**: Unique 8-character Wey IDs for user identification
- **Private Messaging**: Direct messages between contacts
- **Contact Management**: Add/remove contacts by Wey ID
- **Global Chat**: Public chat room for all users
- **Message Types**: Text messages and ping notifications

## Data Flow

1. **Authentication**: User registers/logs in with private key → Server validates → Client stores credentials
2. **Transaction Creation**: User inputs transaction → Client validates → Server saves → Cache invalidation
3. **Analytics**: Client queries aggregated data → Server calculates metrics → Real-time updates
4. **State Management**: TanStack Query handles caching, synchronization, and optimistic updates

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: WebSocket-based connection pooling
- **Migrations**: Drizzle Kit for schema management

### UI Framework
- **shadcn/ui**: Pre-built accessible components
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast backend bundling for production

## Deployment Strategy

### Development
- **Hot Reload**: Vite dev server with Express middleware
- **Database**: Environment-based DATABASE_URL configuration
- **Scripts**: `npm run dev` for development mode

### Production
- **Build Process**: 
  1. Frontend: Vite builds React app to `dist/public`
  2. Backend: ESBuild bundles server code to `dist/index.js`
- **Startup**: Node.js serves built files and API endpoints
- **Environment**: Production mode with optimized builds

### Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Static Files**: Express serves built frontend from `dist/public`
- **API Routes**: All backend routes prefixed with `/api`

The application follows a monorepo structure with clear separation between client, server, and shared code, making it easy to maintain and scale while providing a smooth user experience for personal finance management.