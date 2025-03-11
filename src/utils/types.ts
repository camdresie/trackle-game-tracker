
export interface Game {
  id: string;
  name: string;
  description: string;
  image?: string;
  color: string;
  icon?: string;
  maxScore?: number;
  isCustom?: boolean;
}

export interface Score {
  id: string;
  playerId: string;
  gameId: string;
  value: number;
  date: string;
  createdAt: string;
  notes?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  connectionId?: string;
}

export interface Connection {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface GameStats {
  id: string;
  user_id: string;
  game_id: string;
  best_score?: number;
  average_score?: number;
  total_plays: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  date?: string;
}
