# Emergency Health App

## Overview

This is a mobile-first emergency health application built to help users find hospitals and blood donors during medical emergencies. The app provides real-time access to hospital information and blood request matching to facilitate quick medical assistance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Built using React 18 with TypeScript for type safety and better developer experience
- **Wouter for Routing**: Lightweight client-side routing library replacing React Router for minimal bundle size
- **Vite Build System**: Modern build tool providing fast development server and optimized production builds
- **Tailwind CSS + Shadcn/ui**: Utility-first CSS framework with a comprehensive component library for consistent UI design
- **Mobile-First Design**: Responsive design optimized for mobile devices with touch-friendly interfaces

### State Management
- **TanStack Query (React Query)**: Handles server state management, caching, and data synchronization
- **React Hook Form**: Form state management with validation using Zod schemas
- **Context API**: Used for authentication state and theme management

### Backend Architecture
- **Express.js Server**: RESTful API server with middleware for logging, error handling, and request processing
- **Session-based Authentication**: Uses express-session with PostgreSQL storage via connect-pg-simple
- **Replit Auth Integration**: OAuth2/OIDC authentication system integrated with Replit's authentication service

### Data Storage
- **PostgreSQL Database**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database toolkit with schema-first approach
- **Database Migrations**: Managed through Drizzle Kit for schema versioning

### Database Schema Design
- **Users Table**: Stores user profiles with admin roles and Replit integration
- **Hospitals Table**: Contains hospital information with location data, services, and verification status
- **Blood Requests Table**: Manages urgent blood donation requests with location and urgency tracking
- **Sessions Table**: Handles user session persistence and authentication state

### API Architecture
- **RESTful Endpoints**: Organized by resource type (hospitals, blood requests, users)
- **Query-based Filtering**: Support for location, service type, and urgency-based filtering
- **Admin Operations**: Separate endpoints for content verification and moderation

### Security & Authentication
- **OpenID Connect**: Integration with Replit's OIDC provider for secure authentication
- **Session Management**: Secure session handling with HTTP-only cookies
- **Role-based Access**: Admin and user role differentiation for content management

### Development & Deployment
- **TypeScript Configuration**: Strict typing with path mapping for clean imports
- **Build Process**: Separate client and server builds with esbuild for production optimization
- **Development Mode**: Hot module replacement with Vite and tsx for server development