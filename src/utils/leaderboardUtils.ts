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
  
  // Get today's date for filtering - ensure consistent format
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  console.log('processLeaderboardData - Today\'s date for filtering:', today);
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
        total_games: 0,
        today_score: null,
        latest_play: null
      });
    }
    
    // Now get the user stats and update them
    const userStats = userStatsMap.get(userId);
    if (!userStats) continue; // Skip if user somehow not in map
    
    // Increase total games
    userStats.total_games += 1;
    
    // Add to total score
    userStats.total_score += score.value;
    
    // Calculate average score
    userStats.average_score = userStats.total_score / userStats.total_games;
    
    // Update best score (for games where lower is better like Wordle, take the minimum)
    if (['wordle', 'mini-crossword'].includes(selectedGame)) {
      userStats.best_score = userStats.best_score === 0 
        ? score.value 
        : Math.min(userStats.best_score, score.value);
    } else {
      userStats.best_score = Math.max(userStats.best_score, score.value);
    }
    
    // Process today's scores - IMPORTANT: Make sure date formats match exactly
    const scoreDate = new Date(score.date).toISOString().split('T')[0];
    if (scoreDate === today) {
      console.log(`Today's score found for user ${userStats.username}: ${score.value}, date: ${scoreDate}`);
      userStats.today_score = score.value;
    }
    
    // Update latest play date
    const scoreDateTime = new Date(score.created_at).getTime();
    if (!userStats.latest_play || scoreDateTime > new Date(userStats.latest_play).getTime()) {
      userStats.latest_play = score.date;
    }
  }
  
  // Add any missing game stats entries to ensure all players are represented
  if (gameStatsData && gameStatsData.length > 0) {
    gameStatsData.forEach(stat => {
      const userId = stat.user_id;
      const profile = stat.profiles;
      
      if (!userStatsMap.has(userId) || userStatsMap.get(userId)?.total_games === 0) {
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
      }
    });
  }
  
  // Convert map to array
  const leaderboardPlayers = Array.from(userStatsMap.values());
  
  console.log('processLeaderboardData - Processed leaderboard players:', leaderboardPlayers.length);
  
  // Log how many players have today's scores
  const playersWithTodayScores = leaderboardPlayers.filter(p => p.today_score !== null);
  console.log('processLeaderboardData - Players with today\'s scores:', playersWithTodayScores.length);
  
  return leaderboardPlayers;
};

/**
 * Filter and sort players based on selected criteria
 */
export const filterAndSortPlayers = (
  leaderboardPlayers: LeaderboardPlayer[],
  searchTerm: string,
  showFriendsOnly: boolean,
  selectedFriendIds: string[],
  timeFilter: 'all' | 'today',
  sortBy: string,
  selectedGame: string,
  userId?: string,
  friendIds: string[] = []
): LeaderboardPlayer[] => {
  if (!leaderboardPlayers.length) return [];
  
  console.log('filterAndSortPlayers - Filtering and sorting players, time filter:', timeFilter);
  console.log('filterAndSortPlayers - Players before filtering:', leaderboardPlayers.length);
  
  // Make a copy to avoid modifying the original data
  let filteredPlayers = [...leaderboardPlayers];
  
  // For today filter, only include players with today's scores
  if (timeFilter === 'today') {
    filteredPlayers = filteredPlayers.filter(player => player.today_score !== null);
    console.log('filterAndSortPlayers - Players with today scores:', filteredPlayers.length);
  }
  
  // Search filter
  if (searchTerm) {
    filteredPlayers = filteredPlayers.filter(player => 
      player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.full_name && player.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  // Friends filter
  if (showFriendsOnly) {
    if (selectedFriendIds.length > 0) {
      // Show specific friends and current user
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userId || selectedFriendIds.includes(player.player_id)
      );
    } else {
      // Show all friends and current user
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userId || friendIds.includes(player.player_id)
      );
    }
  }
  
  // Sort players
  filteredPlayers.sort((a, b) => {
    if (timeFilter === 'today') {
      // If filtering by today's scores
      if (a.today_score === null && b.today_score === null) return 0;
      if (a.today_score === null) return 1;
      if (b.today_score === null) return -1;
      
      // Sort by today's score
      if (['wordle', 'mini-crossword'].includes(selectedGame)) {
        // For games where lower is better
        return a.today_score - b.today_score;
      } else {
        // For games where higher is better
        return b.today_score - a.today_score;
      }
    } else {
      // Sort by the selected criteria for all-time
      switch (sortBy) {
        case 'totalScore':
          return b.total_score - a.total_score;
        case 'bestScore':
          if (['wordle', 'mini-crossword'].includes(selectedGame)) {
            // For games where lower is better, handle 0 scores
            if (a.best_score === 0 && b.best_score === 0) return 0;
            if (a.best_score === 0) return 1;
            if (b.best_score === 0) return -1;
            return a.best_score - b.best_score;
          }
          return b.best_score - a.best_score;
        case 'totalGames':
          return b.total_games - a.total_games;
        case 'averageScore':
          if (['wordle', 'mini-crossword'].includes(selectedGame)) {
            // For games where lower is better, handle 0 scores
            if (a.average_score === 0 && b.average_score === 0) return 0;
            if (a.average_score === 0) return 1;
            if (b.average_score === 0) return -1;
            return a.average_score - b.average_score;
          }
          return b.average_score - a.average_score;
        default:
          // Default sorting
          if (['wordle', 'mini-crossword'].includes(selectedGame)) {
            if (a.best_score === 0 && b.best_score === 0) return 0;
            if (a.best_score === 0) return 1;
            if (b.best_score === 0) return -1;
            return a.best_score - b.best_score;
          }
          return b.total_score - a.total_score;
      }
    }
  });
  
  console.log('filterAndSortPlayers - Final sorted and filtered players:', filteredPlayers.length);
  return filteredPlayers;
};
