import { Database } from '@/types/database.types';

// Game 
export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  maxScore?: number;
  externalUrl?: string;
}

// Score
export interface Score {
  id: string;
  gameId: string;
  playerId: string;
  value: number;
  date: string;
  createdAt: string;
}

// User profile
export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

// Friend request
export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// Achievement
export interface Achievement {
  id: string;
  gameId?: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  unlockedAt?: string;
}

// Game Stats
export interface GameStats {
  id: string;
  game_id: string;
  player_id: string;
  total_plays: number;
  best_score: number;
  average_score: number;
  current_streak: number;
  longest_streak: number;
  updated_at: string;
}
