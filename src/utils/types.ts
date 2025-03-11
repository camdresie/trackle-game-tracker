
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
  id: string;
  gameId: string;
  userId: string;
  bestScore: number;
  averageScore: number;
  totalPlays: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: string;
  gameId?: string;
  criteria: (scores: Score[]) => boolean;
}

export interface Connection {
  id: string;
  user_id?: string;
  friend_id?: string;
  status: 'pending' | 'accepted';
  created_at?: string;
  updated_at?: string;
  // For Supabase join data
  friend?: Array<{
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }>;
  user?: Array<{
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }>;
}
