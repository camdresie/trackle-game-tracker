import { Player } from '@/utils/types';
import { LeaderboardPlayer, GameStatsWithProfile } from '@/types/leaderboard';
import { getTodayInEasternTime } from '@/utils/dateUtils';
import { isLowerScoreBetter } from '@/utils/gameData';

/**
 * Transforms game stats and scores data into leaderboard players format with performance optimizations
 */
export const processLeaderboardData = (
  gameStatsData: GameStatsWithProfile[] | undefined,
  scoresData: any[] | undefined,
  selectedGame: string,
  friends: Player[],
  userId: string | undefined,
  profilesData: any[] | undefined
): LeaderboardPlayer[] => {
  console.time('processLeaderboardData');
  if (!profilesData) return [];
  
  // Get today's date in Eastern Time for filtering
  const today = getTodayInEasternTime();
  
  // Initialize user stats map
  const userStatsMap = new Map<string, LeaderboardPlayer>();
  
  // First, add all users from profiles data - only include essential fields
  if (profilesData && profilesData.length > 0) {
    for (let i = 0; i < profilesData.length; i++) {
      const profile = profilesData[i];
      if (!userStatsMap.has(profile.id)) {
        userStatsMap.set(profile.id, {
          player_id: profile.id,
          username: profile.username || "Unknown", 
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          total_score: 0,
          best_score: 0,
          average_score: 0,
          total_games: 0,
          today_score: null,
          latest_play: null
        });
      }
    }
  }
  
  // Filter scores for the current game if a specific game is selected - do this early to reduce processing
  const gameScores = scoresData && selectedGame && selectedGame !== 'all' ? 
    scoresData.filter(score => score.game_id === selectedGame) : 
    scoresData || [];
  
  // Optimization: Early exit if no scores
  if (gameScores.length === 0) {
    console.timeEnd('processLeaderboardData');
    return Array.from(userStatsMap.values());
  }
  
  // Process all unique scores for each user by deduplicating dates
  const userUniqueScores = new Map<string, Map<string, any>>();
  
  // First, sort scores by created_at date (newest first) - sort in place to avoid copying
  const sortedScores = gameScores.slice(0);
  sortedScores.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Group scores by user and date, keeping only the newest for each day
  for (let i = 0; i < sortedScores.length; i++) {
    const score = sortedScores[i];
    const userId = score.user_id;
    const date = score.date;
    const dateKey = `${date}`;
    
    // Initialize user's scores map if needed
    if (!userUniqueScores.has(userId)) {
      userUniqueScores.set(userId, new Map<string, any>());
    }
    
    const userScoresMap = userUniqueScores.get(userId)!;
    
    // Only add if we haven't seen this date for this user yet (ensures we keep newest version per day)
    if (!userScoresMap.has(dateKey)) {
      userScoresMap.set(dateKey, score);
    }
  }
  
  // Process each user's unique scores
  userUniqueScores.forEach((datesMap, userId) => {
    // Get user stats or initialize if not exists
    if (!userStatsMap.has(userId)) {
      // Try to get profile from scores
      const someScore = datesMap.values().next().value;
      const profile = someScore?.profiles || {
        id: userId,
        username: "Unknown Player",
        full_name: null,
        avatar_url: null
      };
      
      userStatsMap.set(userId, {
        player_id: userId,
        username: profile.username || "Unknown",
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        total_score: 0,
        best_score: 0,
        average_score: 0,
        total_games: 0,
        today_score: null,
        latest_play: null
      });
    }
    
    const userStats = userStatsMap.get(userId)!;
    
    // Set total games to the number of unique dates
    userStats.total_games = datesMap.size;
    
    // Now process each unique score to calculate other stats
    let totalScore = 0;
    let todayScore = null;
    let latestPlay = null;
    let bestScore: number | null = null;
    const lowerIsBetter = isLowerScoreBetter(selectedGame);
    
    // Process scores using for...of instead of creating additional arrays
    for (const score of datesMap.values()) {
      totalScore += score.value;
      
      // Set today's score if applicable
      if (score.isToday) {
        todayScore = score.value;
      }
      
      // Update best score
      if (lowerIsBetter) {
        // Lower is better: Update if current best is null or score is lower
        if (bestScore === null || score.value < bestScore) {
          bestScore = score.value;
        }
      } else {
        // Higher is better: Update if current best is null or score is higher
        if (bestScore === null || score.value > bestScore) {
          bestScore = score.value;
        }
      }
      
      // Update latest play date
      const scoreDateTime = new Date(score.created_at || score.date).getTime();
      if (!latestPlay || scoreDateTime > new Date(latestPlay).getTime()) {
        latestPlay = score.date;
      }
    }
    
    // Update the user's stats
    userStats.total_score = totalScore;
    userStats.average_score = datesMap.size > 0 ? totalScore / datesMap.size : 0;
    userStats.best_score = bestScore ?? 0;
    userStats.today_score = todayScore;
    userStats.latest_play = latestPlay;
  });
  
  // Make sure game stats entries are also represented
  if (gameStatsData && gameStatsData.length > 0) {
    for (let i = 0; i < gameStatsData.length; i++) {
      const stat = gameStatsData[i];
      const userId = stat.user_id;
      
      // Skip if user already has processed scores
      if (userUniqueScores.has(userId)) {
        continue;
      }
      
      // Otherwise create or update entry from game stats
      if (!userStatsMap.has(userId)) {
        const profile = stat.profiles;
        
        userStatsMap.set(userId, {
          player_id: userId,
          username: profile.username || "Unknown", 
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          total_score: (stat.average_score || 0) * stat.total_plays,
          best_score: stat.best_score !== null && stat.best_score !== undefined ? stat.best_score : 0,
          average_score: stat.average_score || 0,
          total_games: stat.total_plays,
          today_score: null,
          latest_play: null
        });
      } else {
        // If user exists but doesn't have game data from scores, use game stats
        const userStats = userStatsMap.get(userId)!;
        if (userStats.total_games === 0) {
          userStats.total_games = stat.total_plays;
          userStats.best_score = stat.best_score !== null && stat.best_score !== undefined ? stat.best_score : 0;
          userStats.average_score = stat.average_score || 0;
          userStats.total_score = (stat.average_score || 0) * stat.total_plays;
        }
      }
    }
  }
  
  // Convert map to array
  const leaderboardPlayers = Array.from(userStatsMap.values());
  
  // Filter out players who have never played any games
  const activePlayers = leaderboardPlayers.filter(player => player.total_games > 0);
  
  console.timeEnd('processLeaderboardData');
  return activePlayers;
};
