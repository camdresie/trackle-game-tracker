
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
  notes?: string;
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
  name?: string;
  criteria?: any;
  color?: string;
  earned?: boolean;
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

// Player (used for friends and other users)
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  connectionId?: string;
  status?: string;
}

// Friend Group
export interface FriendGroup {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  members?: Player[];
  pendingMembers?: Player[];
  pendingCount?: number;
  isJoinedGroup?: boolean;
  status?: 'pending' | 'accepted' | 'rejected' | 'left';
}

// Group Message
export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender?: {
    username: string;
    avatar_url?: string;
    id: string;
  };
}
