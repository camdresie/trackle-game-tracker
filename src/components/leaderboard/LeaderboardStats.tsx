
import React from 'react';
import { Trophy, Users, ChevronsUpDown, User, Loader2, Calendar, Star } from 'lucide-react';
import { games } from '@/utils/gameData';

interface LeaderboardPlayer {
  player_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_score: number;
  best_score: number;
  average_score: number;
  total_games: number;
  today_score: number | null;
}

interface LeaderboardStatsProps {
  timeFilter: 'all' | 'today';
  isLoading: boolean;
  players: LeaderboardPlayer[];
  selectedGame: string;
  scoresCount: number;
  rawScoresData: any[]; // Adding raw scores data to analyze
}

const LeaderboardStats = ({ 
  timeFilter, 
  isLoading, 
  players, 
  selectedGame,
  scoresCount,
  rawScoresData
}: LeaderboardStatsProps) => {
  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate active players who have scores
  const activePlayers = players.filter(player => {
    if (timeFilter === 'today') {
      return player.today_score !== null && player.today_score !== 0;
    } else {
      return player.total_games > 0;
    }
  });
  
  // Count today's games more accurately
  const todayGamesCount = timeFilter === 'today' 
    ? rawScoresData.filter(score => {
        // Get today's date in the same format as the score date
        const scoreDate = typeof score.date === 'string' 
          ? score.date 
          : new Date(score.date).toISOString().split('T')[0];
        return scoreDate === today && score.game_id === selectedGame;
      }).length
    : scoresCount;
  
  // For leader, find the top player based on appropriate score
  let leaderPlayer = null;
  if (activePlayers.length > 0) {
    if (timeFilter === 'today') {
      // Sort by today's score (handling Wordle's lower-is-better scoring)
      leaderPlayer = [...activePlayers].sort((a, b) => {
        if (selectedGame === 'wordle' || selectedGame === 'mini-crossword') {
          if (a.today_score === 0 || a.today_score === null) return 1;
          if (b.today_score === 0 || b.today_score === null) return -1;
          return a.today_score! - b.today_score!;
        } else {
          return (b.today_score || 0) - (a.today_score || 0);
        }
      })[0];
    } else {
      // Sort by best score for all-time
      leaderPlayer = [...activePlayers].sort((a, b) => {
        if (selectedGame === 'wordle' || selectedGame === 'mini-crossword') {
          if (a.best_score === 0) return 1;
          if (b.best_score === 0) return -1;
          return a.best_score - b.best_score;
        } else {
          return b.best_score - a.best_score;
        }
      })[0];
    }
  }

  // Debug the scores data
  console.log('Raw scores for stats:', rawScoresData);
  console.log('Time filter:', timeFilter);
  console.log('Active players count:', activePlayers.length);
  console.log('Active players:', activePlayers);
  console.log('Leader player:', leaderPlayer);
  console.log('Today games count:', todayGamesCount);
  
  return (
    <div className="glass-card rounded-xl p-5 animate-slide-up" style={{animationDelay: '200ms'}}>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {timeFilter === 'all' ? (
          <>
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>All-Time Stats</span>
          </>
        ) : (
          <>
            <Calendar className="w-5 h-5 text-green-500" />
            <span>Today's Stats</span>
          </>
        )}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              activePlayers.length || 0
            )}
          </div>
          <div className="text-sm text-muted-foreground">Active Players</div>
        </div>
        
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold">
            {selectedGame === 'all' ? games.length : 1}
          </div>
          <div className="text-sm text-muted-foreground">Games Tracked</div>
        </div>
        
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <ChevronsUpDown className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              todayGamesCount
            )}
          </div>
          <div className="text-sm text-muted-foreground">Total Scores</div>
        </div>
        
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : leaderPlayer ? (
              leaderPlayer.username
            ) : (
              '-'
            )}
          </div>
          <div className="text-sm text-muted-foreground">Current Leader</div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardStats;
