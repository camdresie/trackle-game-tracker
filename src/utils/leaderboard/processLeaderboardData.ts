
import { Player } from '@/utils/types';
import { LeaderboardPlayer, GameStatsWithProfile } from '@/types/leaderboard';
import { getTodayInEasternTime } from '@/utils/dateUtils';

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
  
  // Get today's date in Eastern Time for filtering
  const today = getTodayInEasternTime();
  console.log('processLeaderboardData - Today\'s date in ET (YYYY-MM-DD):', today);
  
  // Initialize user stats map
  const userStatsMap = new Map<string, LeaderboardPlayer>();
  
  // First, add all users from profiles data
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
  
  console.log(`processLeaderboardData - Game ${selectedGame} - Total filtered scores:`, gameScores.length);
  
  // Count and log today's scores using the isToday flag
  const todayScores = gameScores.filter(score => score.isToday);
  console.log(`processLeaderboardData - Found ${todayScores.length} scores marked as today's scores`);
  
  if (todayScores.length > 0) {
    console.log('Today\'s scores in processLeaderboardData:', todayScores.map(score => {
      return {
        id: score.id,
        user_id: score.user_id,
        username: score.profiles?.username,
        date: score.date,
        value: score.value,
        isToday: score.isToday
      };
    }));
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
  
  // Deduplicate scores by user, game, and date
  // This ensures we only count one game per day per user
  const uniqueDatesPerUser = new Map<string, Set<string>>();
  const uniqueScores = new Map<string, any>();
  
  // First pass: create a map of unique dates per user
  gameScores.forEach(score => {
    const userId = score.user_id;
    
    // Initialize set for this user if not exists
    if (!uniqueDatesPerUser.has(userId)) {
      uniqueDatesPerUser.set(userId, new Set<string>());
    }
    
    // Get the date set for this user
    const dateSet = uniqueDatesPerUser.get(userId)!;
    
    // Add this date to the user's set of dates
    dateSet.add(score.date);
    
    // Update the unique score map with the most recent score for this date
    const key = `${userId}-${score.date}`;
    
    if (!uniqueScores.has(key) || 
        new Date(score.created_at) > new Date(uniqueScores.get(key).created_at)) {
      uniqueScores.set(key, score);
    }
  });
  
  // Convert unique dates into game counts
  uniqueDatesPerUser.forEach((dateSet, userId) => {
    if (!userGameCounts[userId]) {
      userGameCounts[userId] = dateSet.size;
    }
  });
  
  console.log('Game counts after deduplication:', userGameCounts);
  
  // Use the unique scores for calculating other stats
  const processedScores = Array.from(uniqueScores.values());
  console.log(`Unique scores after deduplication by user and date: ${processedScores.length}`);
  
  // Process all unique scores for the selected game to calculate totals
  for (const score of processedScores) {
    const userId = score.user_id;
    
    // If user doesn't exist in map yet, add them
    if (!userStatsMap.has(userId)) {
      // Try to get profile info from user_profile attached to score
      const profile = score.profiles || {
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
    
    // Make sure total_games is set from our deduplicated counts
    userStats.total_games = userGameCounts[userId] || 0;
    
    // Add to total score
    userStats.total_score += score.value;
    
    // Calculate average score
    userStats.average_score = userStats.total_games > 0 ? 
      (userStats.total_score / userStats.total_games) : 0;
    
    // Update best score (for games where lower is better like Wordle and Mini Crossword, take the minimum)
    if (['wordle', 'mini-crossword'].includes(selectedGame)) {
      userStats.best_score = userStats.best_score === 0 
        ? score.value 
        : Math.min(userStats.best_score, score.value);
    } else {
      userStats.best_score = Math.max(userStats.best_score, score.value);
    }
    
    // Set today's score if the score is from today (using the isToday flag)
    if (score.isToday) {
      console.log(`Setting today's score for user ${userStats.username}: ${score.value}, ID: ${score.id}`);
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
  
  // Log how many players have today's scores
  const playersWithTodayScores = leaderboardPlayers.filter(p => p.today_score !== null);
  console.log('processLeaderboardData - Players with today\'s scores:', playersWithTodayScores.length);
  
  if (playersWithTodayScores.length > 0) {
    console.log('Players with today scores:', playersWithTodayScores.map(p => ({
      username: p.username,
      player_id: p.player_id,
      today_score: p.today_score
    })));
  }
  
  return leaderboardPlayers;
};
