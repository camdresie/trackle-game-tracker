import { LeaderboardPlayer } from '@/types/leaderboard';
import { formatInTimeZone } from 'date-fns-tz';
import { isLowerScoreBetter } from '@/utils/gameData';

/**
 * Get the current date in Eastern Time (ET)
 * @returns Date string in YYYY-MM-DD format for Eastern Time
 */
const getEasternTimeDate = (): string => {
  return formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
};

// Define games where lower scores are better for reuse
// const lowerScoreBetterGames = ['wordle', 'mini-crossword', 'connections', 'framed', 'nerdle', 'minute-cryptic']; // Remove this local list

/**
 * Filter and sort players based on selected criteria with performance optimizations
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
  includeAllFriends: boolean = false // Parameter to include all friends regardless of group
): LeaderboardPlayer[] => {
  if (!leaderboardPlayers.length) return [];
  
  // Performance optimization for today filter - filter early before other operations
  let filteredPlayers: LeaderboardPlayer[];
  
  // For today view, we should filter for today's scores first
  if (timeFilter === 'today') {
    // Only keep players with a non-null today_score
    filteredPlayers = leaderboardPlayers.filter(player => player.today_score !== null);
    
    // Early return if no players with today scores
    if (filteredPlayers.length === 0) {
      console.timeEnd('filterAndSortPlayers');
      return [];
    }
  } else {
    // Make a copy to avoid modifying the original data
    filteredPlayers = [...leaderboardPlayers];
  }
  
  // Search filter
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filteredPlayers = filteredPlayers.filter(player => 
      player.username.toLowerCase().includes(lowerSearchTerm) ||
      (player.full_name && player.full_name.toLowerCase().includes(lowerSearchTerm))
    );
  }
  
  // Friends filter - optimize by pre-processing IDs for lookup
  if (showFriendsOnly) {
    // Convert IDs to Sets for faster lookup
    const friendIdsSet = new Set(friendIds);
    const selectedFriendIdsSet = new Set(selectedFriendIds);
    const groupMemberIdsSet = new Set(selectedGroupMemberIds);
    const userIdStr = userId ? userId.toString() : '';
    
    if (includeAllFriends) {
      // For the "All Friends" view, include all friends and current user
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userIdStr || friendIdsSet.has(player.player_id)
      );
    } else if (groupMemberIdsSet.size > 0) {
      // Show specific group members and current user
      // Add user ID to the set if not already included
      if (userId && !groupMemberIdsSet.has(userIdStr)) {
        groupMemberIdsSet.add(userIdStr);
      }
      
      // Filter players
      filteredPlayers = filteredPlayers.filter(player => 
        groupMemberIdsSet.has(player.player_id.toString())
      );
    } else if (selectedFriendIdsSet.size > 0) {
      // Show specific friends and current user
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userIdStr || selectedFriendIdsSet.has(player.player_id)
      );
    } else {
      // Show all friends and current user
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userIdStr || friendIdsSet.has(player.player_id)
      );
    }
  }
  
  // Sorting - optimize before truncating to maxPlayers
  const isLowerBetter = isLowerScoreBetter(selectedGame);
  
  if (timeFilter === 'today') {
    // For today view, sort by today's score
    if (isLowerBetter) {
      // For games where lower is better
      filteredPlayers.sort((a, b) => (a.today_score || 999) - (b.today_score || 999));
    } else {
      // For games where higher is better
      filteredPlayers.sort((a, b) => (b.today_score || 0) - (a.today_score || 0));
    }
  } else {
    // Sort by the selected criteria for all-time
    switch (sortBy) {
      case 'bestScore':
        if (isLowerBetter) {
          // For games where lower is better, sort ascending. Handle nulls appropriately.
          filteredPlayers.sort((a, b) => {
            const scoreA = a.best_score === null ? Infinity : a.best_score;
            const scoreB = b.best_score === null ? Infinity : b.best_score;
            return scoreA - scoreB;
          });
        } else {
          // For games where higher is better, sort descending. Handle nulls appropriately.
          filteredPlayers.sort((a, b) => {
            const scoreA = a.best_score === null ? -Infinity : a.best_score;
            const scoreB = b.best_score === null ? -Infinity : b.best_score;
            return scoreB - scoreA;
          });
        }
        break;
      case 'totalGames':
        filteredPlayers.sort((a, b) => b.total_games - a.total_games);
        break;
      case 'averageScore':
        if (isLowerBetter) {
          // For games where lower is better, sort ascending. Handle nulls appropriately.
          filteredPlayers.sort((a, b) => {
            const scoreA = a.average_score === null ? Infinity : a.average_score;
            const scoreB = b.average_score === null ? Infinity : b.average_score;
            return scoreA - scoreB;
          });
        } else {
          // For games where higher is better, sort descending. Handle nulls appropriately.
          filteredPlayers.sort((a, b) => {
            const scoreA = a.average_score === null ? -Infinity : a.average_score;
            const scoreB = b.average_score === null ? -Infinity : b.average_score;
            return scoreB - scoreA;
          });
        }
        break;
      default:
        // Default sorting for all-time view is average score
        if (isLowerBetter) {
          filteredPlayers.sort((a, b) => {
            const scoreA = a.average_score === null ? Infinity : a.average_score;
            const scoreB = b.average_score === null ? Infinity : b.average_score;
            return scoreA - scoreB;
          });
        } else {
          filteredPlayers.sort((a, b) => {
            const scoreA = a.average_score === null ? -Infinity : a.average_score;
            const scoreB = b.average_score === null ? -Infinity : b.average_score;
            return scoreB - scoreA;
          });
        }
    }
  }
  
  // Limit to maximum number of players (default 25)
  const result = filteredPlayers.slice(0, maxPlayers);
  
  return result;
};
