
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
  maxPlayers: number = 25 // Default to 25 players maximum
): LeaderboardPlayer[] => {
  if (!leaderboardPlayers.length) return [];
  
  console.log('filterAndSortPlayers - Filtering and sorting players, time filter:', timeFilter);
  console.log('filterAndSortPlayers - Players before filtering:', leaderboardPlayers.length);
  
  // Make a copy to avoid modifying the original data
  let filteredPlayers = [...leaderboardPlayers];
  
  // For debugging/development, log players with today scores
  const playersWithTodayScores = filteredPlayers.filter(player => player.today_score !== null);
  console.log('Number of players with today scores before filtering:', playersWithTodayScores.length);
  if (playersWithTodayScores.length > 0) {
    console.log('Players with today scores:', playersWithTodayScores.map(p => ({
      username: p.username,
      today_score: p.today_score
    })));
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
    if (selectedGroupMemberIds.length > 0) {
      // Show specific group members and current user
      console.log('Filtering by selected group members:', selectedGroupMemberIds);
      console.log('Current user ID:', userId);
      
      filteredPlayers = filteredPlayers.filter(player => 
        player.player_id === userId || selectedGroupMemberIds.includes(player.player_id)
      );
      
      console.log('Players after group filtering:', filteredPlayers.length);
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
  
  // IMPORTANT: For today view, we should keep the filtering for today's scores here
  // but we need to make sure the data is properly populated before it gets here
  if (timeFilter === 'today') {
    // Only keep players with a non-null today_score
    const beforeFilter = filteredPlayers.length;
    filteredPlayers = filteredPlayers.filter(player => player.today_score !== null);
    console.log(`Players with today scores: ${filteredPlayers.length} out of ${beforeFilter}`);
    
    // Log players with today scores after filtering
    if (filteredPlayers.length > 0) {
      console.log('Final players in today view:', filteredPlayers.map(p => ({
        username: p.username,
        today_score: p.today_score
      })));
    } else {
      console.log('No players with today scores after filtering');
    }
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
  
  console.log('filterAndSortPlayers - Final sorted and filtered players before limit:', filteredPlayers.length);
  
  // Limit to maximum number of players (default 25)
  filteredPlayers = filteredPlayers.slice(0, maxPlayers);
  
  console.log('filterAndSortPlayers - Final players returned after limit:', filteredPlayers.length);
  return filteredPlayers;
};
