
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
  
  // Get today's date for filtering - ensure consistent format
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  console.log('Today\'s date for filtering:', today);
  console.log('Raw scores data:', scoresData);
  
  // Initialize user stats map with profiles
  const userStatsMap = new Map<string, LeaderboardPlayer>();
  
  // Process all game stats profiles first
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
  
  // Make sure all friends are in the map
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
  
  // Add current user if not already in the map
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
  const gameScores = selectedGame ? 
    scoresData.filter(score => score.game_id === selectedGame) : 
    scoresData;
  
  console.log(`Game ${selectedGame} - All filtered scores:`, gameScores);
  
  // Add all players who have scores to the map, even if they don't have game stats
  gameScores.forEach(score => {
    const userId = score.user_id;
    if (!userStatsMap.has(userId)) {
      userStatsMap.set(userId, {
        player_id: userId,
        username: "Player " + userId.substring(0, 6), // Temporary username
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
      const statEntry = gameStatsData?.find(stat => stat.user_id === userId);
      if (statEntry) {
        const userEntry = userStatsMap.get(userId);
        if (userEntry) {
          userEntry.username = statEntry.profiles.username || "Unknown Player";
          userEntry.full_name = statEntry.profiles.full_name;
          userEntry.avatar_url = statEntry.profiles.avatar_url;
        }
      }
    }
  });
  
  // Process today's scores specifically
  const todayScores = gameScores.filter(score => {
    const scoreDate = new Date(score.date).toISOString().split('T')[0];
    return scoreDate === today;
  });
  
  console.log(`Game ${selectedGame} - Today's scores:`, todayScores);
  
  // Process all scores for the selected game to calculate totals
  for (const score of gameScores) {
    const userId = score.user_id;
    const userStats = userStatsMap.get(userId);
    
    if (!userStats) {
      console.warn(`User ${userId} not found in map, creating entry`);
      // This should not happen as we've already added all users with scores to the map
      continue;
    }
    
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
    
    // Process today's scores
    const scoreDate = new Date(score.date).toISOString().split('T')[0];
    if (scoreDate === today) {
      userStats.today_score = score.value;
      console.log(`Setting today's score for user ${userId}: ${score.value}`);
    }
    
    // Update latest play date
    const scoreDateTime = new Date(score.created_at).getTime();
    if (!userStats.latest_play || scoreDateTime > new Date(userStats.latest_play).getTime()) {
      userStats.latest_play = score.date;
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
  console.log('Players before filtering:', leaderboardPlayers);
  
  // Make a copy to avoid modifying the original data
  let filteredPlayers = [...leaderboardPlayers];
  
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
  
  // For today's filter, only show players who have a score today
  if (timeFilter === 'today') {
    console.log('Filtering for today only, before filter:', filteredPlayers.length);
    filteredPlayers = filteredPlayers.filter(player => {
      const hasScoreToday = player.today_score !== null;
      if (hasScoreToday) {
        console.log(`Player ${player.username} has today's score: ${player.today_score}`);
      }
      return hasScoreToday;
    });
    console.log('After today filter:', filteredPlayers.length);
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
  
  console.log('Final sorted and filtered players:', filteredPlayers);
  return filteredPlayers;
};
