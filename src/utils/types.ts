
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
  playerId?: string; // For legacy/mock data compatibility
  friendId?: string; // For legacy/mock data compatibility
  status: 'pending' | 'accepted';
  createdAt?: string;
  created_at?: string; // Supabase format
  updated_at?: string; // Supabase format
  friend?: any; // For Supabase join data
  user?: any; // For Supabase join data
}
