import React, { useEffect } from 'react';
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
  // Get today's date in YYYY-MM-DD format for consistent comparison
  const today = new Date().toISOString().split('T')[0];
  
  // Consider players with at least one game to be active
  const activePlayers = players.filter(player => player.total_games > 0);
  
  // Calculate total games played by summing each player's game count
  // This is more accurate than counting individual scores which may be filtered
  const gamesPlayedCount = timeFilter === 'today'
    ? rawScoresData.filter(score => {
        // Use the formattedDate field for consistent comparison
        const formattedDate = score.formattedDate || 
          (typeof score.date === 'string' 
            ? score.date.split('T')[0] 
            : new Date(score.date).toISOString().split('T')[0]);
        
        return formattedDate === today;
      }).length
    : activePlayers.reduce((total, player) => total + player.total_games, 0);
  
  // Debug logging to track our calculations
  useEffect(() => {
    console.log(`LeaderboardStats - Counting games played for ${selectedGame}`);
    console.log(`LeaderboardStats - Using timeFilter: ${timeFilter}`);
    console.log(`LeaderboardStats - Today's date (YYYY-MM-DD): ${today}`);
    console.log(`LeaderboardStats - Total raw scores available: ${rawScoresData?.length || 0}`);
    console.log(`LeaderboardStats - Active players: ${activePlayers.length}`);
    
    // Log each player's game count in all-time mode
    if (timeFilter === 'all') {
      console.log('Player game counts:');
      activePlayers.forEach(player => {
        console.log(`${player.username}: ${player.total_games} games`);
      });
      console.log(`Total games calculated: ${gamesPlayedCount}`);
    }
    
    // Count and log scores that match today's date
    if (timeFilter === 'today') {
      const todayScores = rawScoresData.filter(score => {
        // Use formattedDate if available, otherwise format the date
        const formattedDate = score.formattedDate || 
          (typeof score.date === 'string' 
            ? score.date.split('T')[0] 
            : new Date(score.date).toISOString().split('T')[0]);
        
        const isToday = formattedDate === today;
        
        if (isToday) {
          console.log(`LeaderboardStats - MATCH: Score from today found: ${score.user_id}, value: ${score.value}, date: ${score.date}, formattedDate: ${formattedDate}`);
        }
        
        return isToday;
      });
      
      console.log(`LeaderboardStats - Scores found for today (${today}):`, todayScores.length);
      
      if (todayScores.length > 0) {
        console.log('Sample today scores:', todayScores.slice(0, 2).map(s => ({
          id: s.id,
          user_id: s.user_id,
          date: s.date,
          formattedDate: s.formattedDate || new Date(s.date).toISOString().split('T')[0],
          value: s.value
        })));
      } else {
        console.log('No scores found for today');
      }
    }
    
    console.log(`LeaderboardStats - Final calculated games played count: ${gamesPlayedCount}`);
  }, [rawScoresData, selectedGame, timeFilter, today, gamesPlayedCount, activePlayers]);
  
  // Find the top player based on appropriate score
  let leaderPlayer = null;
  if (activePlayers.length > 0) {
    if (timeFilter === 'today') {
      // For today's view, only consider players with today's scores
      const playersWithTodayScores = activePlayers.filter(p => p.today_score !== null);
      console.log(`LeaderboardStats - Players with today scores: ${playersWithTodayScores.length}`);
      
      if (playersWithTodayScores.length > 0) {
        // Sort by today's score (handling Wordle's lower-is-better scoring)
        leaderPlayer = [...playersWithTodayScores]
          .sort((a, b) => {
            if (selectedGame === 'wordle' || selectedGame === 'mini-crossword') {
              return (a.today_score || 0) - (b.today_score || 0);
            } else {
              return (b.today_score || 0) - (a.today_score || 0);
            }
          })[0];
      }
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
