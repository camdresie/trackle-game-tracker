
import React from 'react';
import { Trophy, Users, ChevronsUpDown, Star, Loader2, Calendar } from 'lucide-react';
import { LeaderboardPlayer } from '@/types/leaderboard';

interface LeaderboardStatsProps {
  timeFilter: 'all' | 'today';
  isLoading: boolean;
  players: LeaderboardPlayer[];
  selectedGame: string;
  totalScoresCount: number; 
  rawScoresData: any[]; // Raw scores data for analysis
}

const LeaderboardStats = ({ 
  timeFilter, 
  isLoading, 
  players, 
  selectedGame,
  totalScoresCount, 
  rawScoresData
}: LeaderboardStatsProps) => {
  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  
  // Consider players with at least one game to be active
  const activePlayers = players.filter(player => player.total_games > 0);
  
  // Calculate total games played - SIMPLIFIED APPROACH
  let gamesPlayedCount = 0;
  
  if (rawScoresData && rawScoresData.length > 0) {
    if (timeFilter === 'today') {
      // Count today's games only
      gamesPlayedCount = rawScoresData.filter(score => {
        const isCorrectGame = selectedGame === 'all' || score.game_id === selectedGame;
        const scoreDate = new Date(score.date).toISOString().split('T')[0];
        const isToday = scoreDate === today;
        return isCorrectGame && isToday;
      }).length;
    } else {
      // Count all games for the selected game type
      if (selectedGame !== 'all') {
        gamesPlayedCount = rawScoresData.filter(score => score.game_id === selectedGame).length;
      } else {
        gamesPlayedCount = rawScoresData.length;
      }
    }
  }
  
  // Debug logging to ensure we're getting the right counts
  console.log(`LeaderboardStats - Counting games played for ${selectedGame}`);
  console.log(`LeaderboardStats - Using timeFilter: ${timeFilter}`);
  console.log(`LeaderboardStats - Total raw scores available: ${rawScoresData?.length || 0}`);
  console.log(`LeaderboardStats - Calculated games played count: ${gamesPlayedCount}`);
  
  if (rawScoresData && rawScoresData.length > 0) {
    // Log first few scores for debugging
    console.log('Sample of score data:', rawScoresData.slice(0, 3));
    
    // Count by game type for debugging
    const gameTypeCounts = {};
    rawScoresData.forEach(score => {
      gameTypeCounts[score.game_id] = (gameTypeCounts[score.game_id] || 0) + 1;
    });
    console.log('Counts by game type:', gameTypeCounts);
  }
  
  // Find the top player based on appropriate score
  let leaderPlayer = null;
  if (activePlayers.length > 0) {
    if (timeFilter === 'today') {
      // Sort by today's score (handling Wordle's lower-is-better scoring)
      leaderPlayer = [...activePlayers]
        .filter(p => p.today_score !== null)
        .sort((a, b) => {
          if (selectedGame === 'wordle' || selectedGame === 'mini-crossword') {
            return (a.today_score || 0) - (b.today_score || 0);
          } else {
            return (b.today_score || 0) - (a.today_score || 0);
          }
        })[0];
    } else {
      // Sort by best score for all-time
      leaderPlayer = [...activePlayers].sort((a, b) => {
        if (selectedGame === 'wordle' || selectedGame === 'mini-crossword') {
          if (a.best_score === 0 && b.best_score === 0) return 0;
          if (a.best_score === 0) return 1;
          if (b.best_score === 0) return -1;
          return a.best_score - b.best_score;
        } else {
          return b.best_score - a.best_score;
        }
      })[0];
    }
  }
  
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
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <ChevronsUpDown className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              gamesPlayedCount
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {timeFilter === 'today' ? "Today's Games" : "Games Played"}
          </div>
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
