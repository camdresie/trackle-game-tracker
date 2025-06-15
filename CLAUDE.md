# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trackle is a React web application for tracking scores from popular word games and puzzles (Wordle, Mini Crossword, Connections, etc.), connecting with friends, and competing on leaderboards. Built with React, TypeScript, Vite, Tailwind CSS, shadcn/ui components, and Supabase.

## Development Commands

### Primary Commands
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build locally

### Testing Commands
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report

### Environment-Specific Commands
- `npm run dev:staging` - Development with staging environment
- `npm run dev:prod` - Development with production environment
- `npm run build:staging` - Build for staging deployment
- `npm run build:dev` - Build for development environment

## Architecture Overview

### State Management Pattern
- **Global State**: React Context for authentication (AuthContext) and theme (ThemeContext)
- **Server State**: React Query (@tanstack/react-query) for API calls and caching
- **Real-time Updates**: Supabase real-time subscriptions for live score updates

### Authentication Flow
1. Users authenticate via Supabase Auth (email/password)
2. AuthContext manages session state and profile data
3. ProtectedRoute component guards authenticated routes
4. Profile creation happens automatically on signup with onboarding flow

### Database Integration
- **Client**: Supabase client configured in `src/integrations/supabase/client.ts`
- **Types**: Auto-generated TypeScript types in `src/integrations/supabase/types.ts`
- **Services**: Database operations abstracted in `src/services/` directory
- **Real-time**: Live subscriptions for score updates in game detail views

### Component Architecture
- **UI Components**: shadcn/ui components in `src/components/ui/`
- **Feature Components**: Organized by domain (auth, game, home, connections, etc.)
- **Page Components**: Route-level components in `src/pages/`
- **Hooks**: Custom hooks organized by feature in `src/hooks/`

### Key Data Flow Patterns

#### Score Management
- **useGameData**: Composite hook combining game details, friends, and scores
- **scoreService**: Handles CRUD operations with automatic stats updates
- **Real-time sync**: Automatic invalidation of React Query caches on score changes

#### Friend System
- **Connections**: Many-to-many relationship between users
- **Friend Groups**: Users can create groups for easier score sharing
- **Search**: Username-based friend discovery with real-time search

#### Game Configuration
- Game definitions stored in `src/utils/gameData.ts`
- Each game has scoring rules (higher/lower is better, max scores, units)
- Dynamic score validation based on game configuration

### TypeScript Configuration
- Strict mode disabled (`strictNullChecks: false`) for easier development
- Path aliases: `@/*` maps to `src/*`
- Unused parameters/locals warnings disabled

### Styling System
- **Tailwind CSS** for utility-first styling
- **CSS Variables** for theme colors (light/dark mode)
- **shadcn/ui** component system with consistent design tokens
- **Responsive Design** with mobile-first approach

### Environment Configuration
- Multi-environment support (development, staging, production)
- Environment detection in `src/utils/environment.ts`
- Supabase configuration varies by environment

### Testing Infrastructure
- **Framework**: Vitest with jsdom environment for fast, modern testing
- **React Testing**: @testing-library/react for component testing
- **Mocking**: MSW (Mock Service Worker) for API mocking in tests
- **Setup**: Comprehensive mocks for Supabase, authentication, and browser APIs
- **Location**: Tests located in `__tests__` directories alongside source files

## Key Files to Understand

- `src/contexts/AuthContext.tsx` - Authentication state and user profile management
- `src/hooks/useGameData.ts` - Central hook for game data, friends, and scores
- `src/services/scoreService.ts` - Database operations for scores with stats updates
- `src/utils/gameData.ts` - Game definitions and scoring rules
- `src/integrations/supabase/client.ts` - Database client configuration
- `src/test/setup.ts` - Test setup and global mocks
- `vitest.config.ts` - Test configuration