import React, { useEffect } from 'react';
import { Trophy, Users, Gamepad, Star, Loader2, Calendar, Award, Target, Blocks, Share2 } from 'lucide-react';
import { LeaderboardPlayer, SortByOption } from '@/types/leaderboard';
import { formatInTimeZone } from 'date-fns-tz';
import { Card, CardContent } from '@/components/ui/card';
import LeaderboardShare from './LeaderboardShare';
import { cn } from '@/lib/utils';
import { isLowerScoreBetter } from '@/utils/gameData';

// Define games where lower scores are better for reuse
// const lowerScoreBetterGames = ['wordle', 'mini-crossword', 'connections', 'framed', 'nerdle', 'minute-cryptic'];

interface LeaderboardStatsProps {
  timeFilter: 'all' | 'today';
  isLoading: boolean;
  players: LeaderboardPlayer[];
  selectedGame: string;
  totalScoresCount: number; 
  rawScoresData: any[]; // Raw scores data for analysis
  sortByCategory: string; // Mapped category for internal display logic (e.g., 'highestAverage')
  sortByOption: SortByOption; // Original sort option for sharing (e.g., 'averageScore')
  className?: string; // Add optional className prop
}

const LeaderboardStats = ({ 
  timeFilter, 
  isLoading, 
  players, 
  selectedGame,
  totalScoresCount, 
  rawScoresData,
  sortByCategory, // Use this for internal display
  sortByOption,   // Pass this to Share
  className
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
  
  // Calculate players count based on time filter
  const playersCount = timeFilter === 'today' 
    ? todayPlayersCount 
    : activePlayers.length;
  
  // Calculate total games played based on the time filter
  const gamesPlayedCount = timeFilter === 'today' 
    ? todayGamesCount 
    : activePlayers.reduce((total, player) => total + player.total_games, 0);
  
  // Find player with highest average score
  let highestAveragePlayer = null;
  if (activePlayers.length > 0) {
    highestAveragePlayer = [...activePlayers].sort((a, b) => {
      if (isLowerScoreBetter(selectedGame)) {
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
          ((isLowerScoreBetter(selectedGame) && value < userBestScores.get(userId).score) ||
           (!isLowerScoreBetter(selectedGame) && value > userBestScores.get(userId).score))) {
        userBestScores.set(userId, { username, score: value });
      }
    });
    
    const sortedUsers = [...userBestScores.entries()].sort(([, a], [, b]) => {
      if (isLowerScoreBetter(selectedGame)) {
        return a.score - b.score; // Lower is better
      } else {
        return b.score - a.score; // Higher is better
      }
    });
    
    if (sortedUsers.length > 0) {
      // Get the best score value to display
      const bestScoreValue = sortedUsers[0][1].score;
      bestScorePlayer = { username: sortedUsers[0][1].username, best_score: bestScoreValue };
    }
  } else if (activePlayers.length > 0) {
    // For all-time view, use best_score
    bestScorePlayer = [...activePlayers].sort((a, b) => {
      if (isLowerScoreBetter(selectedGame)) {
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
      // Get the game count to display
      const gamesCount = sortedUsers[0][1].count;
      mostGamesPlayer = { username: sortedUsers[0][1].username, total_games: gamesCount };
    }
  } else if (activePlayers.length > 0) {
    // For all-time view, use total_games
    mostGamesPlayer = [...activePlayers].sort((a, b) => b.total_games - a.total_games)[0];
  }
  
  // Helper function to format score based on game type
  const formatScore = (score: number | null): string => { // Allow null
    if (score === null || score === undefined) return '-';
    
    // Format time-based scores for Mini Crossword
    if (selectedGame === 'mini-crossword') {
        // Round the score to the nearest whole number
        const roundedScore = Math.round(score);
        if (roundedScore <= 0) return '0:00'; // Check rounded score
        const minutes = Math.floor(roundedScore / 60);
        const seconds = roundedScore % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Format to at most 1 decimal place for average scores
    if (typeof score === 'number' && !Number.isInteger(score)) {
      return score.toFixed(1);
    }
    
    return score.toString();
  };

  // Determine which leader card to show in the third position based on selected filter
  const renderDynamicLeaderCard = () => {
    // Card for today view (Today's Best Score)
    if (timeFilter === 'today') {
      return (
        <Card className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center transition-colors duration-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-semibold truncate">
              {isLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
              ) : bestScorePlayer ? (
                  bestScorePlayer.username
              ) : (
                  '-'
              )}
            </div>
            {!isLoading && bestScorePlayer && (
                <div className="text-base font-medium">
                  {formatScore(bestScorePlayer.best_score)}
                </div>
            )}
            <div className="text-xs sm:text-sm text-muted-foreground">
              Today's Best Score
            </div>
          </CardContent>
        </Card>
      );
    }

    // For all-time view, show leader based on the mapped sortByCategory prop
    switch(sortByCategory) {
      case 'highestAverage':
        return (
          <Card className="bg-primary/20 rounded-lg p-3 sm:p-4 text-center transition-colors duration-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-semibold truncate">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : highestAveragePlayer ? (
                  highestAveragePlayer.username
                ) : (
                  '-'
                )}
              </div>
              {!isLoading && highestAveragePlayer && (
                <div className="text-base font-medium">
                  {formatScore(highestAveragePlayer.average_score)}
                </div>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground">
                Best Average Score
              </div>
            </CardContent>
          </Card>
        );
      case 'bestScore':
        return (
          <Card className="bg-primary/20 rounded-lg p-3 sm:p-4 text-center transition-colors duration-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-semibold truncate">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : bestScorePlayer ? (
                  bestScorePlayer.username
                ) : (
                  '-'
                )}
              </div>
              {!isLoading && bestScorePlayer && (
                <div className="text-base font-medium">
                  {formatScore(bestScorePlayer.best_score)}
                </div>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground">
                Best Score
              </div>
            </CardContent>
          </Card>
        );
      case 'mostGames':
        return (
          <Card className="bg-primary/20 rounded-lg p-3 sm:p-4 text-center transition-colors duration-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-center mb-2">
                <Blocks className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-xl sm:text-2xl font-semibold truncate">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : mostGamesPlayer ? (
                  mostGamesPlayer.username
                ) : (
                  '-'
                )}
              </div>
              {!isLoading && mostGamesPlayer && (
                <div className="text-base font-medium">
                  {/* Display total_games directly, don't format as time */} 
                  {mostGamesPlayer.total_games?.toString() ?? '-'} 
                </div>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground">
                Most Games Played
              </div>
            </CardContent>
          </Card>
        );
      default: // Should not happen if sortByCategory is handled correctly
        // Default to a non-highlighted card (e.g., Total Scores or empty)
        return (
           <Card className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center transition-colors duration-200">
            <CardContent className="p-0">
                <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-xl sm:text-2xl font-semibold">
                    {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : '-'}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                    Select Filter
                </div>
            </CardContent>
           </Card>
        );
    }
  };
  
  return (
    <div className={cn("glass-card rounded-xl p-4 sm:p-5 animate-slide-up", className)} style={{animationDelay: '200ms'}}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
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
        
        {/* Share button - Pass sortByOption here */}
        <LeaderboardShare 
          players={players}
          selectedGame={selectedGame}
          timeFilter={timeFilter}
          sortBy={sortByOption} // Pass the original SortByOption
        />
      </div>
      
      {/* Stats cards - with dynamic third card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {/* Active Players Card */}
        <Card className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center transition-colors duration-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-semibold">
              {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : playersCount}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {timeFilter === 'today' ? 'Players Today' : 'Active Players'}
            </div>
          </CardContent>
        </Card>
        
        {/* Games Played Card */}
        <Card className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center transition-colors duration-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-center mb-2">
              <Gamepad className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-xl sm:text-2xl font-semibold">
              {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : gamesPlayedCount}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {timeFilter === 'today' ? 'Games Today' : 'Games Played'}
            </div>
          </CardContent>
        </Card>
        
        {/* Dynamic third card based on filter selection */}
        <div className="col-span-2 sm:col-span-1">
          {renderDynamicLeaderCard()} 
        </div>
      </div>
    </div>
  );
};

export default LeaderboardStats;
