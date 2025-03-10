
export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  maxScore: number;
  isCustom?: boolean;
}

export interface Score {
  id: string;
  gameId: string;
  playerId: string;
  value: number;
  date: string;
  notes?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
}

export interface GameStats {
  gameId: string;
  playerId: string;
  bestScore: number;
  averageScore: number;
  totalPlays: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface Connection {
  id: string;
  playerId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}
