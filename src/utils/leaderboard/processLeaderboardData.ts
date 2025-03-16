
import { Player } from '@/utils/types';
import { LeaderboardPlayer, GameStatsWithProfile } from '@/types/leaderboard';

/**
 * Transforms game stats and scores data into leaderboard players format
 */
export const processLeaderboardData = (
  gameStatsData: GameStatsWithProfile[] | undefined,
  scoresData: any[] | undefined,
  selectedGame: string,
  friends: Player[],
  userId: string | undefined,
  profilesData: any[] | undefined
): LeaderboardPlayer[] => {
  if (!profilesData) return [];
  
  // Get today's date for filtering - ensure consistent format as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  console.log('processLeaderboardData - Today\'s date for filtering (YYYY-MM-DD):', today);
  console.log('processLeaderboardData - Raw scores data count:', scoresData?.length || 0);
  
  // Initialize user stats map
  const userStatsMap = new Map<string, LeaderboardPlayer>();
  
  // First, let's add all users from profiles data if available
  if (profilesData && profilesData.length > 0) {
    profilesData.forEach(profile => {
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
    });
  }
  
  // Filter scores for the current game if a specific game is selected
  const gameScores = scoresData && selectedGame && selectedGame !== 'all' ? 
    scoresData.filter(score => score.game_id === selectedGame) : 
    scoresData || [];
  
  // Debug logging for filtering
  console.log(`processLeaderboardData - Game ${selectedGame} - Filtered scores:`, gameScores.length);
  
  // Log a few scores to see the data structure
  if (gameScores.length > 0) {
    console.log('Sample scores data:', gameScores.slice(0, 2));
  }
  
  // Create a list of user IDs with their total game counts from game stats
  const userGameCounts: Record<string, number> = {};
  
  // If we have game stats data, use it to initialize user game counts
  if (gameStatsData && gameStatsData.length > 0) {
    gameStatsData.forEach(stat => {
      const userId = stat.user_id;
      userGameCounts[userId] = stat.total_plays || 0;
    });
  }
  
  // Process all scores for the selected game to calculate totals
  for (const score of gameScores) {
    const userId = score.user_id;
    
    // If user doesn't exist in map yet, add them
    if (!userStatsMap.has(userId)) {
      // Try to get profile info from user_profile attached to score
      const profile = score.user_profile || {
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
        total_games: userGameCounts[userId] || 0,
        today_score: null,
        latest_play: null
      });
    }
    
    // Get the user stats and update them
    const userStats = userStatsMap.get(userId);
    if (!userStats) continue; // Skip if user somehow not in map
    
    // If we don't already have a total_games count from game_stats, count it from scores
    if (!userGameCounts[userId]) {
      userStats.total_games += 1;
    }
    
    // Add to total score
    userStats.total_score += score.value;
    
    // Calculate average score
    userStats.average_score = userStats.total_games > 0 ? 
      (userStats.total_score / userStats.total_games) : 0;
    
    // Update best score (for games where lower is better like Wordle, take the minimum)
    if (['wordle', 'mini-crossword'].includes(selectedGame)) {
      userStats.best_score = userStats.best_score === 0 
        ? score.value 
        : Math.min(userStats.best_score, score.value);
    } else {
      userStats.best_score = Math.max(userStats.best_score, score.value);
    }
    
    // Process today's scores - using formattedDate for consistent comparison
    const scoreDate = score.formattedDate || 
      (typeof score.date === 'string' 
        ? score.date.split('T')[0] 
        : new Date(score.date).toISOString().split('T')[0]);
        
    if (scoreDate === today) {
      console.log(`TODAY'S SCORE FOUND for user ${userStats.username}: ${score.value}, date: ${score.date}, formatted date: ${scoreDate}`);
      userStats.today_score = score.value;
    }
    
    // Update latest play date
    const scoreDateTime = new Date(score.created_at || score.date).getTime();
    if (!userStats.latest_play || scoreDateTime > new Date(userStats.latest_play).getTime()) {
      userStats.latest_play = score.date;
    }
  }
  
  // Add any missing game stats entries to ensure all players are represented
  if (gameStatsData && gameStatsData.length > 0) {
    gameStatsData.forEach(stat => {
      const userId = stat.user_id;
      const profile = stat.profiles;
      
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          player_id: userId,
          username: profile.username || "Unknown", 
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          total_score: stat.average_score * stat.total_plays,
          best_score: stat.best_score || 0,
          average_score: stat.average_score || 0,
          total_games: stat.total_plays,
          today_score: null,
          latest_play: null
        });
      } else {
        // If the user exists but doesn't have game stats, update them
        const userStats = userStatsMap.get(userId);
        if (userStats && userStats.total_games === 0) {
          userStats.total_games = stat.total_plays;
          userStats.best_score = stat.best_score || 0;
          userStats.average_score = stat.average_score || 0;
          userStats.total_score = stat.average_score * stat.total_plays;
        }
      }
    });
  }
  
  // Convert map to array
  const leaderboardPlayers = Array.from(userStatsMap.values());
  
  console.log('processLeaderboardData - Processed leaderboard players:', leaderboardPlayers.length);
  console.log('processLeaderboardData - Total game count for all players:', 
    leaderboardPlayers.reduce((sum, player) => sum + player.total_games, 0));
  
  // Log how many players have today's scores
  const playersWithTodayScores = leaderboardPlayers.filter(p => p.today_score !== null);
  console.log('processLeaderboardData - Players with today\'s scores:', playersWithTodayScores.length);
  if (playersWithTodayScores.length > 0) {
    console.log('Players with today scores:', playersWithTodayScores.map(p => ({
      username: p.username,
      today_score: p.today_score
    })));
  }
  
  return leaderboardPlayers;
};
