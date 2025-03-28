
# Trackle - Game Tracker

A web application for tracking scores from popular word games and puzzles, sharing with friends, and competing on leaderboards.

![Trackle Screenshot](public/og-image.png)

## 🎮 Features

- **Track Your Scores**: Log and track your daily scores for Wordle, Mini Crossword, Connections, and more
- **Friend System**: Connect with friends to see their scores and compete
- **Leaderboards**: See how you stack up against others
- **Game Details**: View detailed statistics for each game, including best scores and averages
- **Profile Management**: Customize your profile and select your favorite games
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, React Context for app state
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Hosting**: Lovable platform

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16+)
- npm, yarn, or pnpm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trackle-game-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/    # UI components
│   ├── ui/        # Base UI components from shadcn/ui
│   ├── auth/      # Authentication components
│   ├── game/      # Game-related components
│   ├── home/      # Home page components
│   └── ...
├── contexts/      # React contexts for state management
├── hooks/         # Custom React hooks
│   ├── connections/   # Connection-related hooks
│   ├── leaderboard/   # Leaderboard-related hooks
│   └── ...
├── lib/           # Utility libraries and configurations
├── pages/         # Application pages/routes
├── services/      # API service functions
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## 🔐 Authentication

The application uses Supabase for authentication. Users can sign up with email/password and are required to complete an onboarding flow when they first sign in.

## 💾 Database Schema

The main tables in the database include:
- `profiles`: User profile information
- `connections`: Friend connections between users
- `game_stats`: Aggregated statistics for each game and user
- `scores`: Individual game scores

## 🧩 Key Components

### AuthContext

Manages user authentication state and provides authentication-related functions throughout the app.

### ProtectedRoute

Ensures that routes are only accessible to authenticated users, redirecting to the login page if not authenticated.

### Game-related Hooks

- `useGameData`: Retrieves comprehensive game data
- `useGameDetails`: Fetches basic game information and player scores
- `useFriendScores`: Gets scores for friends on a specific game

### Connection System

- `useConnections`: Gets a user's friend connections
- `useConnectionMutations`: Functions for creating/accepting/rejecting friend requests

## 📝 Development Guidelines

1. **Component Creation**: Create new files for every component, no matter how small
2. **TypeScript**: Use TypeScript types for all components and functions
3. **Error Handling**: Implement proper error handling for API calls
4. **Testing**: Test all features on both desktop and mobile viewports

## 🚀 Deployment

The app can be deployed directly from Lovable by clicking on the "Publish" button. For custom domain setup, refer to the [Lovable documentation](https://docs.lovable.dev/).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
