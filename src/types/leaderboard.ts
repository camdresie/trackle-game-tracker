
export interface LeaderboardPlayer {
  player_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_score: number;
  best_score: number;
  average_score: number;
  total_games: number;
  today_score: number | null;
  latest_play: string | null;
}

export interface GameStatsWithProfile {
  id: string;
  user_id: string;
  game_id: string;
  best_score: number;
  average_score: number;
  total_plays: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export type TimeFilter = 'all' | 'today';
export type SortByOption = 'totalScore' | 'bestScore' | 'totalGames' | 'averageScore';
