
import { LeaderboardPlayer } from '@/types/leaderboard';

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
  
  // For testing/development, include all players in today view if there are no today scores
  const playersWithTodayScores = filteredPlayers.filter(player => player.today_score !== null);
  console.log('Number of players with today scores before filtering:', playersWithTodayScores.length);
  if (playersWithTodayScores.length > 0) {
    console.log('Players with today scores:', playersWithTodayScores.map(p => ({
      username: p.username,
      today_score: p.today_score
    })));
  }
  
  const useFallbackForToday = timeFilter === 'today' && playersWithTodayScores.length === 0;
  
  // For today filter, only include players with today's scores
  if (timeFilter === 'today' && !useFallbackForToday) {
    filteredPlayers = filteredPlayers.filter(player => player.today_score !== null);
    console.log('filterAndSortPlayers - Players with today scores after filtering:', filteredPlayers.length);
    
    if (filteredPlayers.length > 0) {
      console.log('Sample players with today scores:', 
        filteredPlayers.slice(0, 3).map(p => ({
          username: p.username,
          today_score: p.today_score
        }))
      );
    } else {
      console.log('No players found with today scores after filtering');
    }
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
    if (timeFilter === 'today' && !useFallbackForToday) {
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
          // Default sorting for all-time view is average score
          if (['wordle', 'mini-crossword'].includes(selectedGame)) {
            if (a.average_score === 0 && b.average_score === 0) return 0;
            if (a.average_score === 0) return 1;
            if (b.average_score === 0) return -1;
            return a.average_score - b.average_score;
          }
          return b.average_score - a.average_score;
      }
    }
  });
  
  console.log('filterAndSortPlayers - Final sorted and filtered players:', filteredPlayers.length);
  return filteredPlayers;
};
