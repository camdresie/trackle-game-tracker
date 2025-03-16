
import React, { useEffect } from 'react';
import { Trophy, Users, ChevronsUpDown, Star, Loader2, Calendar } from 'lucide-react';
import { LeaderboardPlayer } from '@/types/leaderboard';
import { format, addDays } from 'date-fns';

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
    const now = new Date();
    const nowUTC = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(), 
      now.getUTCHours(),
      now.getUTCMinutes(), 
      now.getUTCSeconds()
    );
    
    // Eastern Time offset (EST, UTC-5)
    const etOffsetHours = -5;
    
    // Calculate the time in ET
    const etTime = new Date(nowUTC.getTime() + (etOffsetHours * 60 * 60 * 1000));
    
    return format(etTime, 'yyyy-MM-dd');
  };
  
  // Get today's date in YYYY-MM-DD format for consistent comparison
  const today = getEasternTimeDate();
  // For development purposes, also consider scores from the day before
  const yesterday = addDays(new Date(today), -1);
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
  
  // Consider players with at least one game to be active
  const activePlayers = players.filter(player => player.total_games > 0);
  
  // Calculate total games played by counting scores for today or all time
  const gamesPlayedCount = timeFilter === 'today'
    ? rawScoresData.filter(score => {
        // Use the formattedDate field for consistent comparison
        const formattedDate = score.formattedDate || 
          (typeof score.date === 'string' 
            ? format(new Date(score.date), 'yyyy-MM-dd') 
            : format(score.date, 'yyyy-MM-dd'));
        
        return formattedDate === today || formattedDate === yesterdayStr;
      }).length
    : activePlayers.reduce((total, player) => total + player.total_games, 0);
  
  // Debug logging to track our calculations
  useEffect(() => {
    console.log(`LeaderboardStats - Counting games played for ${selectedGame}`);
    console.log(`LeaderboardStats - Using timeFilter: ${timeFilter}`);
    console.log(`LeaderboardStats - Today's date (YYYY-MM-DD): ${today}`);
    console.log(`LeaderboardStats - Yesterday's date (YYYY-MM-DD): ${yesterdayStr}`);
    console.log(`LeaderboardStats - Total raw scores available: ${rawScoresData?.length || 0}`);
    console.log(`LeaderboardStats - Active players: ${activePlayers.length}`);
    
    // Count scores that match today's date
    if (timeFilter === 'today') {
      const todayScores = rawScoresData.filter(score => {
        // Use formattedDate if available, otherwise format the date
        const formattedDate = score.formattedDate || 
          (typeof score.date === 'string' 
            ? format(new Date(score.date), 'yyyy-MM-dd') 
            : format(score.date, 'yyyy-MM-dd'));
        
        const isToday = formattedDate === today;
        const isYesterday = formattedDate === yesterdayStr;
        
        if (isToday || isYesterday) {
          console.log(`LeaderboardStats - MATCH: Score from today/yesterday found:`, {
            id: score.id,
            user_id: score.user_id,
            raw_date: score.date,
            formattedDate: formattedDate,
            today: today,
            yesterday: yesterdayStr,
            value: score.value,
            matches_today: isToday,
            matches_yesterday: isYesterday
          });
        }
        
        return isToday || isYesterday;
      });
      
      console.log(`LeaderboardStats - Scores found for today/yesterday:`, todayScores.length);
      
      if (todayScores.length > 0) {
        console.log('Sample today/yesterday scores:', todayScores.slice(0, Math.min(5, todayScores.length)).map(s => ({
          id: s.id,
          user_id: s.user_id,
          date: s.date,
          formattedDate: s.formattedDate || format(new Date(s.date), 'yyyy-MM-dd'),
          value: s.value
        })));
      } else {
        console.log('No scores found for today/yesterday');
      }
      
      // Count unique users who have played today
      const uniqueUserIds = new Set(todayScores.map(s => s.user_id));
      console.log(`LeaderboardStats - Unique users with scores today/yesterday: ${uniqueUserIds.size}`);
      if (uniqueUserIds.size > 0) {
        console.log('Unique user IDs with today/yesterday scores:', Array.from(uniqueUserIds));
      }
    }
    
    console.log(`LeaderboardStats - Final calculated games played count: ${gamesPlayedCount}`);
  }, [rawScoresData, selectedGame, timeFilter, today, yesterdayStr, gamesPlayedCount, activePlayers]);
  
  // Find the top player based on appropriate score
  let leaderPlayer = null;
  if (activePlayers.length > 0) {
    if (timeFilter === 'today') {
      // For today's view, only consider players with today's scores
      const playersWithTodayScores = activePlayers.filter(p => p.today_score !== null);
      console.log(`LeaderboardStats - Players with today scores: ${playersWithTodayScores.length}`);
      
      if (playersWithTodayScores.length > 0) {
        // Log all players with today scores for debugging
        console.log('Players with today scores:', playersWithTodayScores.map(p => ({
          username: p.username, 
          today_score: p.today_score
        })));
        
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
            ) : timeFilter === 'today' ? (
              // For today's view, count players with today scores
              players.filter(p => p.today_score !== null).length
            ) : (
              activePlayers.length || 0
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
