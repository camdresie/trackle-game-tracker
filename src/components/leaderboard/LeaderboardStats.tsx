
import React, { useEffect } from 'react';
import { Trophy, Users, Gamepad, Star, Loader2, Calendar, Award, Target, Blocks } from 'lucide-react';
import { LeaderboardPlayer } from '@/types/leaderboard';
import { formatInTimeZone } from 'date-fns-tz';
import { Card, CardContent } from '@/components/ui/card';

interface LeaderboardStatsProps {
  timeFilter: 'all' | 'today';
  isLoading: boolean;
  players: LeaderboardPlayer[];
  selectedGame: string;
  totalScoresCount: number; 
  rawScoresData: any[]; // Raw scores data for analysis
  sortBy: string; // Add sortBy prop
}

const LeaderboardStats = ({ 
  timeFilter, 
  isLoading, 
  players, 
  selectedGame,
  totalScoresCount, 
  rawScoresData,
  sortBy // Use this to highlight relevant stat
}: LeaderboardStatsProps) => {
  // Get today's date in YYYY-MM-DD format for consistent comparison
  const getEasternTimeDate = (): string => {
    return formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
  };
  
  const today = getEasternTimeDate();
  
  // Consider players with at least one game to be active
  const activePlayers = players.filter(player => player.total_games > 0);
  
  // For today's view, use the isToday flag directly from raw scores data
  const todayScores = rawScoresData.filter(score => score.isToday);
  
  // Count unique users who have played today
  const uniqueUserIds = [...new Set(todayScores.map(s => s.user_id))];
  const todayPlayersCount = uniqueUserIds.length;
  const todayGamesCount = todayScores.length;
  
  // Debug logging for today's data
  useEffect(() => {
    console.log(`LeaderboardStats - Today's date (YYYY-MM-DD): ${today}`);
    console.log(`LeaderboardStats - Total raw scores: ${rawScoresData?.length || 0}`);
    
    if (timeFilter === 'today') {
      console.log(`LeaderboardStats - Scores marked as today: ${todayScores.length}`);
      
      if (todayScores.length > 0) {
        console.log('Today\'s scores details:', todayScores.map(s => ({
          id: s.id,
          user_id: s.user_id,
          date: s.date,
          isToday: s.isToday,
          value: s.value
        })));
      }
      
      console.log(`LeaderboardStats - Unique users with today's scores: ${uniqueUserIds.length}`);
      if (uniqueUserIds.length > 0) {
        console.log('Unique user IDs with today\'s scores:', uniqueUserIds);
      }
    }
  }, [rawScoresData, timeFilter, today, todayScores, uniqueUserIds]);
  
  // Calculate total games played based on the time filter
  const gamesPlayedCount = timeFilter === 'today' 
    ? todayGamesCount 
    : activePlayers.reduce((total, player) => total + player.total_games, 0);
  
  // Calculate players count based on time filter
  const playersCount = timeFilter === 'today' 
    ? todayPlayersCount 
    : activePlayers.length;
  
  // Find player with highest average score
  let highestAveragePlayer = null;
  if (activePlayers.length > 0) {
    highestAveragePlayer = [...activePlayers].sort((a, b) => {
      if (['wordle', 'mini-crossword'].includes(selectedGame)) {
        // For games where lower is better
        if (a.average_score === 0) return 1;
        if (b.average_score === 0) return -1;
        return a.average_score - b.average_score;
      } else {
        return b.average_score - a.average_score;
      }
    })[0];
  }

  // Find player with most best scores (for today view, use today's scores)
  let bestScorePlayer = null;
  if (timeFilter === 'today' && todayScores.length > 0) {
    // For today view, simply find the best score among today's scores
    const userBestScores = new Map();
    
    todayScores.forEach(score => {
      const userId = score.user_id;
      const username = score.profiles?.username || 'Unknown';
      const value = score.value;
      
      if (!userBestScores.has(userId) || 
          ((['wordle', 'mini-crossword'].includes(selectedGame) && value < userBestScores.get(userId).score) ||
           (!['wordle', 'mini-crossword'].includes(selectedGame) && value > userBestScores.get(userId).score))) {
        userBestScores.set(userId, { username, score: value });
      }
    });
    
    const sortedUsers = [...userBestScores.entries()].sort(([, a], [, b]) => {
      if (['wordle', 'mini-crossword'].includes(selectedGame)) {
        return a.score - b.score; // Lower is better
      } else {
        return b.score - a.score; // Higher is better
      }
    });
    
    if (sortedUsers.length > 0) {
      bestScorePlayer = { username: sortedUsers[0][1].username };
    }
  } else if (activePlayers.length > 0) {
    // For all-time view, use best_score
    bestScorePlayer = [...activePlayers].sort((a, b) => {
      if (['wordle', 'mini-crossword'].includes(selectedGame)) {
        // For games where lower is better
        if (a.best_score === 0) return 1;
        if (b.best_score === 0) return -1;
        return a.best_score - b.best_score;
      } else {
        return b.best_score - a.best_score;
      }
    })[0];
  }

  // Find player with most games played
  let mostGamesPlayer = null;
  if (timeFilter === 'today' && todayScores.length > 0) {
    // For today view, count by user
    const userGameCounts = new Map();
    
    todayScores.forEach(score => {
      const userId = score.user_id;
      const username = score.profiles?.username || 'Unknown';
      userGameCounts.set(userId, {
        username,
        count: (userGameCounts.get(userId)?.count || 0) + 1
      });
    });
    
    const sortedUsers = [...userGameCounts.entries()].sort(([, a], [, b]) => b.count - a.count);
    
    if (sortedUsers.length > 0) {
      mostGamesPlayer = { username: sortedUsers[0][1].username };
    }
  } else if (activePlayers.length > 0) {
    // For all-time view, use total_games
    mostGamesPlayer = [...activePlayers].sort((a, b) => b.total_games - a.total_games)[0];
  }
  
  // Determine which card should be highlighted based on the sortBy selection
  const getHighlightClass = (statType: string) => {
    if (timeFilter === 'today') {
      return 'bg-secondary/50'; // Always use default for today view
    }
    
    return sortBy === statType ? 'bg-primary/20' : 'bg-secondary/50';
  };
  
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
      
      {/* Original count stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-secondary/50 rounded-lg p-4 text-center transition-colors duration-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-semibold">
              {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : playersCount}
            </div>
            <div className="text-sm text-muted-foreground">
              Active Players
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/50 rounded-lg p-4 text-center transition-colors duration-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-center mb-2">
              <Gamepad className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-2xl font-semibold">
              {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : gamesPlayedCount}
            </div>
            <div className="text-sm text-muted-foreground">
              Games Played
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/50 rounded-lg p-4 text-center transition-colors duration-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-semibold">
              {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : totalScoresCount}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Scores
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Current Leaders section */}
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <span>Current Leaders</span>
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${getHighlightClass('highestAverage')} rounded-lg p-4 text-center transition-colors duration-200`}>
          <div className="flex items-center justify-center mb-2">
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : highestAveragePlayer ? (
              highestAveragePlayer.username
            ) : (
              '-'
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Highest Average Score
          </div>
        </div>
        
        <div className={`${getHighlightClass('bestScore')} rounded-lg p-4 text-center transition-colors duration-200`}>
          <div className="flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : bestScorePlayer ? (
              bestScorePlayer.username
            ) : (
              '-'
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Best Score
          </div>
        </div>
        
        <div className={`${getHighlightClass('mostGames')} rounded-lg p-4 text-center transition-colors duration-200`}>
          <div className="flex items-center justify-center mb-2">
            <Blocks className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : mostGamesPlayer ? (
              mostGamesPlayer.username
            ) : (
              '-'
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Most Games Played
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardStats;
