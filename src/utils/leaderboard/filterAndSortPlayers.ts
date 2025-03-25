
import { LeaderboardPlayer } from '@/types/leaderboard';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Get the current date in Eastern Time (ET)
 * @returns Date string in YYYY-MM-DD format for Eastern Time
 */
const getEasternTimeDate = (): string => {
  return formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
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
  friendIds: string[] = [],
  selectedGroupMemberIds: string[] = [],
  maxPlayers: number = 25, // Default to 25 players maximum
  includeAllFriends: boolean = false // New parameter to include all friends regardless of group
): LeaderboardPlayer[] => {
  if (!leaderboardPlayers.length) return [];
  
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
    if (includeAllFriends) {
      // For the "All Friends" view, include all friends and current user
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userId || friendIds.includes(player.player_id)
      );
    } else if (selectedGroupMemberIds.length > 0) {
      // Show specific group members and current user
      // Ensure all group member IDs are strings for consistent comparison
      const normalizedGroupMemberIds = selectedGroupMemberIds.map(id => id.toString());
      
      // Add user ID to the list if not already included
      if (userId && !normalizedGroupMemberIds.includes(userId.toString())) {
        normalizedGroupMemberIds.push(userId.toString());
      }
      
      // Filter players
      filteredPlayers = filteredPlayers.filter(player => 
        normalizedGroupMemberIds.includes(player.player_id.toString())
      );
      
    } else if (selectedFriendIds.length > 0) {
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
  
  // For today view, we should keep the filtering for today's scores
  if (timeFilter === 'today') {
    // Only keep players with a non-null today_score
    filteredPlayers = filteredPlayers.filter(player => player.today_score !== null);
  }
  
  // Sort players
  filteredPlayers.sort((a, b) => {
    if (timeFilter === 'today') {
      // For today view, sort by today's score
      if (['wordle', 'mini-crossword'].includes(selectedGame)) {
        // For games where lower is better
        return (a.today_score || 999) - (b.today_score || 999);
      } else {
        // For games where higher is better
        return (b.today_score || 0) - (a.today_score || 0);
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
  
  // Limit to maximum number of players (default 25)
  filteredPlayers = filteredPlayers.slice(0, maxPlayers);
  
  return filteredPlayers;
};
