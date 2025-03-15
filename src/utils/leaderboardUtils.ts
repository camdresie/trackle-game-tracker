
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
  userId: string | undefined
): LeaderboardPlayer[] => {
  if (!gameStatsData || !scoresData) return [];
  
  // Get today's date for filtering
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
  console.log('Today\'s date for filtering:', today);
  
  // Initialize user stats map with profiles
  const userStatsMap = new Map<string, LeaderboardPlayer>();
  
  // First, initialize all players from game stats
  gameStatsData.forEach(stat => {
    const userId = stat.user_id;
    const profile = stat.profiles;
    
    if (!userStatsMap.has(userId)) {
      userStatsMap.set(userId, {
        player_id: userId,
        username: profile.username || "Unknown Player", 
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
  
  // Also make sure ALL friends are in the map, even if they don't have game stats
  friends.forEach(friend => {
    if (!userStatsMap.has(friend.id)) {
      userStatsMap.set(friend.id, {
        player_id: friend.id,
        username: friend.name,
        full_name: null,
        avatar_url: friend.avatar || null,
        total_score: 0,
        best_score: 0,
        average_score: 0,
        total_games: 0,
        today_score: null,
        latest_play: null
      });
    }
  });
  
  // Add the current user if not already in the map
  if (userId && !userStatsMap.has(userId)) {
    userStatsMap.set(userId, {
      player_id: userId,
      username: "You",
      full_name: null,
      avatar_url: null,
      total_score: 0,
      best_score: 0,
      average_score: 0,
      total_games: 0,
      today_score: null,
      latest_play: null
    });
  }
  
  // Filter scores for the current game
  const gameScores = scoresData.filter(score => score.game_id === selectedGame);
  
  // Get today's scores
  const todayScores = gameScores.filter(score => {
    const scoreDate = new Date(score.date).toISOString().split('T')[0];
    const isToday = scoreDate === today;
    if (isToday) {
      console.log(`Found today's score for user ${score.user_id}: ${score.value} on ${scoreDate}`);
    }
    return isToday;
  });
  
  console.log(`Game ${selectedGame} - All scores:`, gameScores);
  console.log(`Game ${selectedGame} - Today's scores:`, todayScores);
  
  // Process ALL scores for the selected game
  for (const score of gameScores) {
    const userId = score.user_id;
    
    // If this user is not in our map, add them
    if (!userStatsMap.has(userId)) {
      userStatsMap.set(userId, {
        player_id: userId,
        username: "Unknown Player", // Will be updated if we find profile data
        full_name: null,
        avatar_url: null,
        total_score: 0,
        best_score: 0,
        average_score: 0,
        total_games: 0,
        today_score: null,
        latest_play: null
      });
      
      // Try to find profile data for this user in game stats
      const statEntry = gameStatsData.find(stat => stat.user_id === userId);
      if (statEntry) {
        const userEntry = userStatsMap.get(userId);
        if (userEntry) {
          userEntry.username = statEntry.profiles.username || "Unknown Player";
          userEntry.full_name = statEntry.profiles.full_name;
          userEntry.avatar_url = statEntry.profiles.avatar_url;
        }
      }
    }
    
    // Get the user's stats from the map
    const userStats = userStatsMap.get(userId);
    if (!userStats) continue;
    
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
    
    // Check if this score is from today
    const scoreDate = new Date(score.date).toISOString().split('T')[0];
    
    if (scoreDate === today) {
      console.log(`Setting today's score for user ${userId}: ${score.value}`);
      userStats.today_score = score.value;
    }
    
    // Update latest play date if newer
    const scoreDateTime = new Date(score.created_at).getTime();
    if (!userStats.latest_play || scoreDateTime > new Date(userStats.latest_play).getTime()) {
      userStats.latest_play = score.date;
    }
  }
  
  // Make a second pass to ensure today's scores are properly set
  for (const score of todayScores) {
    const userId = score.user_id;
    // Make sure this user exists in our map
    if (!userStatsMap.has(userId)) {
      // Create a new entry for this user since they played today
      userStatsMap.set(userId, {
        player_id: userId,
        username: "Unknown Player",
        full_name: null,
        avatar_url: null,
        total_score: score.value,
        best_score: score.value,
        average_score: score.value,
        total_games: 1,
        today_score: score.value,
        latest_play: score.date
      });
      
      // Try to find profile data for this user in game stats
      const statEntry = gameStatsData.find(stat => stat.user_id === userId);
      if (statEntry) {
        const userEntry = userStatsMap.get(userId);
        if (userEntry) {
          userEntry.username = statEntry.profiles.username || "Unknown Player";
          userEntry.full_name = statEntry.profiles.full_name;
          userEntry.avatar_url = statEntry.profiles.avatar_url;
        }
      }
    } else {
      // Update existing user with today's score
      const userStats = userStatsMap.get(userId)!;
      userStats.today_score = score.value;
      
      // Ensure they have at least some games played
      if (userStats.total_games === 0) {
        userStats.total_games = 1;
        userStats.total_score = score.value;
        userStats.best_score = score.value;
        userStats.average_score = score.value;
      }
    }
  }
  
  // Convert map to array
  const leaderboardPlayers = Array.from(userStatsMap.values());
  
  console.log('Processed leaderboard players:', leaderboardPlayers);
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
  
  console.log('Filtering and sorting players, time filter:', timeFilter);
  console.log('Input data:', leaderboardPlayers);
  
  // Make a copy to avoid modifying the original data
  let filteredPlayers = [...leaderboardPlayers];
  
  // Filter by search term
  if (searchTerm) {
    filteredPlayers = filteredPlayers.filter(player => 
      player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.full_name && player.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  // Filter by friends
  if (showFriendsOnly) {
    if (selectedFriendIds.length > 0) {
      // Filter by selected specific friends and include current user
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userId || selectedFriendIds.includes(player.player_id)
      );
    } else {
      // Filter by all friends and include current user
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userId || friendIds.includes(player.player_id)
      );
    }
  }
  
  // For today's filter, only show players who actually have a score today
  if (timeFilter === 'today') {
    console.log('Filtering for today only, before filter:', filteredPlayers.length);
    
    // IMPORTANT FIX: Properly filter for players with today's scores
    filteredPlayers = filteredPlayers.filter(player => {
      const hasScoreToday = player.today_score !== null;
      if (hasScoreToday) {
        console.log(`Player ${player.username} has today's score: ${player.today_score}`);
      }
      return hasScoreToday;
    });
    
    console.log('After today filter:', filteredPlayers.length);
  }
  
  // Sort players based on time filter and sort by criteria
  const sortedPlayers = filteredPlayers.sort((a, b) => {
    // For "today only", sort by today's score
    if (timeFilter === 'today') {
      // If one player has a score and the other doesn't, prioritize the one with a score
      if (a.today_score !== null && b.today_score === null) return -1;
      if (a.today_score === null && b.today_score !== null) return 1;
      
      // Both players have scores, sort by score value
      if (a.today_score !== null && b.today_score !== null) {
        if (['wordle', 'mini-crossword'].includes(selectedGame)) {
          // For games where lower is better
          return a.today_score - b.today_score;
        } else {
          // For games where higher is better
          return b.today_score - a.today_score;
        }
      }
      
      // Neither player has a score for today (should not happen with the filter above)
      return 0;
    } else {
      // Sort by the selected criteria for all-time
      switch (sortBy) {
        case 'totalScore':
          return b.total_score - a.total_score;
        case 'bestScore':
          // For games where lower is better (like Wordle), reverse the sorting
          if (['wordle', 'mini-crossword'].includes(selectedGame)) {
            // Handle scores of 0 (no score) by putting them at the bottom
            if (a.best_score === 0 && b.best_score === 0) return 0;
            if (a.best_score === 0) return 1; // Push a to the bottom
            if (b.best_score === 0) return -1; // Push b to the bottom
            // Otherwise, lower is better for Wordle
            return a.best_score - b.best_score;
          }
          return b.best_score - a.best_score;
        case 'totalGames':
          return b.total_games - a.total_games;
        case 'averageScore':
          // For games where lower is better (like Wordle), reverse the sorting
          if (['wordle', 'mini-crossword'].includes(selectedGame)) {
            // Handle scores of 0 (no score) by putting them at the bottom
            if (a.average_score === 0 && b.average_score === 0) return 0;
            if (a.average_score === 0) return 1; // Push a to the bottom
            if (b.average_score === 0) return -1; // Push b to the bottom
            // Otherwise, lower is better for Wordle
            return a.average_score - b.average_score;
          }
          return b.average_score - a.average_score;
        default:
          // For games where lower is better (like Wordle), sort by best score (lowest first)
          if (['wordle', 'mini-crossword'].includes(selectedGame)) {
            // Handle scores of 0 (no score) by putting them at the bottom
            if (a.best_score === 0 && b.best_score === 0) return 0;
            if (a.best_score === 0) return 1; // Push a to the bottom
            if (b.best_score === 0) return -1; // Push b to the bottom
            // Otherwise, lower is better for Wordle
            return a.best_score - b.best_score;
          }
          // For other games, sort by total score (highest first)
          return b.total_score - a.total_score;
      }
    }
  });
  
  console.log('Final sorted and filtered players:', sortedPlayers);
  return sortedPlayers;
};
