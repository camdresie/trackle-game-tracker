
import { useState, useEffect } from 'react';
import { SortByOption, TimeFilter } from '@/types/leaderboard';
import { games } from '@/utils/gameData';

/**
 * Hook for managing leaderboard filters and sort options
 */
export const useLeaderboardFilters = () => {
  // Initialize with the first game instead of 'all'
  const [selectedGame, setSelectedGame] = useState<string>(games.length > 0 ? games[0].id : '');
  const [sortBy, setSortBy] = useState<SortByOption>('totalScore');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today'); // Changed default to 'today'

  // Map sort options to appropriate stat categories for highlighting
  const mapSortByToStatCategory = (sortOption: SortByOption) => {
    const mapping: Record<SortByOption, string> = {
      'averageScore': 'highestAverage',
      'bestScore': 'bestScore',
      'totalGames': 'mostGames',
      'totalScore': 'totalScore'
    };
    return mapping[sortOption] || 'totalScore';
  };

  // When timeFilter changes, update the sortBy appropriately
  useEffect(() => {
    if (timeFilter === 'all') {
      setSortBy('averageScore'); // Default to average score for "All Time" view
    } else {
      setSortBy('totalScore'); // Keep total score for today's view
    }
  }, [timeFilter]);

  return {
    selectedGame,
    setSelectedGame,
    sortBy: mapSortByToStatCategory(sortBy),
    setSortBy,
    searchTerm,
    setSearchTerm,
    showFriendsOnly,
    setShowFriendsOnly,
    selectedFriendIds,
    setSelectedFriendIds,
    timeFilter,
    setTimeFilter
  };
};
