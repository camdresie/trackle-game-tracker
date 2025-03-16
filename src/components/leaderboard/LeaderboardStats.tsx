import React, { useEffect } from 'react';
import { Trophy, Users, ChevronsUpDown, Star, Loader2, Calendar } from 'lucide-react';
import { LeaderboardPlayer } from '@/types/leaderboard';
import { formatInTimeZone } from 'date-fns-tz';

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
  // Function to get the current date in Eastern Time (ET)
  const getEasternTimeDate = (): string => {
    return formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
  };
  
  // Get today's date in YYYY-MM-DD format for consistent comparison
  const today = getEasternTimeDate();
  
  // Consider players with at least one game to be active
  const activePlayers = players.filter(player => player.total_games > 0);
  
  // Calculate counts directly from rawScoresData for today's view
  // Use the isToday flag set in useScoresData for more reliable filtering
  const todayScores = rawScoresData.filter(score => score.isToday);
  
  // Count unique users who have played today
  const uniqueUserIds = [...new Set(todayScores.map(s => s.user_id))];
  const todayPlayersCount = uniqueUserIds.length;
  const todayGamesCount = todayScores.length;
  
  // Calculate total games played based on the time filter
  const gamesPlayedCount = timeFilter === 'today' 
    ? todayGamesCount 
    : activePlayers.reduce((total, player) => total + player.total_games, 0);
  
  // Calculate players count based on time filter
  const playersCount = timeFilter === 'today' 
    ? todayPlayersCount 
    : activePlayers.length;
  
  // Debug logging to track our calculations
  useEffect(() => {
    console.log(`LeaderboardStats - Counting games played for ${selectedGame}`);
    console.log(`LeaderboardStats - Using timeFilter: ${timeFilter}`);
    console.log(`LeaderboardStats - Today's date (YYYY-MM-DD): ${today}`);
    console.log(`LeaderboardStats - Total raw scores available: ${rawScoresData?.length || 0}`);
    console.log(`LeaderboardStats - Active players: ${activePlayers.length}`);
    
    // Count scores that match today's date
    if (timeFilter === 'today') {
      console.log(`LeaderboardStats - Scores found for today's date:`, todayScores.length);
      
      if (todayScores.length > 0) {
        console.log('Today\'s scores:', todayScores.map(s => ({
          id: s.id,
          user_id: s.user_id,
          username: s.user_profile?.username,
          date: s.date,
          formattedDate: s.formattedDate,
          isToday: s.isToday,
          value: s.value
        })));
      } else {
        console.log('No scores found for today\'s date');
      }
      
      console.log(`LeaderboardStats - Unique users with today's scores: ${uniqueUserIds.length}`);
      if (uniqueUserIds.length > 0) {
        console.log('Unique user IDs with today\'s scores:', uniqueUserIds);
      }
    }
    
    console.log(`LeaderboardStats - Final calculated players count: ${playersCount}`);
    console.log(`LeaderboardStats - Final calculated games played count: ${gamesPlayedCount}`);
  }, [rawScoresData, selectedGame, timeFilter, today, todayScores, uniqueUserIds, playersCount, gamesPlayedCount, activePlayers]);
  
  // Find the top player based on appropriate score
  let leaderPlayer = null;
  if (timeFilter === 'today' && todayScores.length > 0) {
    // For today view, calculate the leader directly from today's scores
    const userScores: Record<string, { userId: string, username: string, score: number }> = {};
    
    // Gather all today's scores by user
    todayScores.forEach(score => {
      const userId = score.user_id;
      const username = score.user_profile?.username || 'Unknown';
      const value = score.value;
      
      // For games where lower is better, keep the lowest score
      // For other games, keep the highest score
      if (!userScores[userId]) {
        userScores[userId] = { userId, username, score: value };
      } else if (['wordle', 'mini-crossword'].includes(selectedGame)) {
        if (value < userScores[userId].score) {
          userScores[userId].score = value;
        }
      } else {
        if (value > userScores[userId].score) {
          userScores[userId].score = value;
        }
      }
    });
    
    // Convert to array and sort
    const sortedUsers = Object.values(userScores).sort((a, b) => {
      if (['wordle', 'mini-crossword'].includes(selectedGame)) {
        return a.score - b.score; // Lower is better
      } else {
        return b.score - a.score; // Higher is better
      }
    });
    
    // Get the top player
    if (sortedUsers.length > 0) {
      leaderPlayer = { username: sortedUsers[0].username };
    }
  } else if (activePlayers.length > 0) {
    // For all-time view, use the existing logic
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
              playersCount || 0
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {timeFilter === 'today' ? "Today's Players" : "Active Players"}
          </div>
        </div>
        
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <ChevronsUpDown className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              gamesPlayedCount || 0
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
