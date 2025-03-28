
import { useState, useEffect } from 'react';
import { SortByOption, TimeFilter } from '@/types/leaderboard';
import { games } from '@/utils/gameData';

/**
 * Hook for managing leaderboard filters and sort options
 */
export const useLeaderboardFilters = () => {
  // Initialize with the first game instead of 'all'
  const [selectedGame, setSelectedGame] = useState<string>(games.length > 0 ? games[0].id : '');
  const [sortBy, setSortBy] = useState<SortByOption>('averageScore'); // Changed default to match "all" time view
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFriendsOnly, setShowFriendsOnly] = useState(true); // Changed default to true to show friends only
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all'); // Changed default to 'all'
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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

  // Reset selected friends when a group is selected
  useEffect(() => {
    if (selectedGroupId) {
      setSelectedFriendIds([]);
    }
  }, [selectedGroupId]);

  // Reset selected group when individual friends are selected
  useEffect(() => {
    if (selectedFriendIds.length > 0) {
      setSelectedGroupId(null);
    }
  }, [selectedFriendIds]);

  return {
    selectedGame,
    setSelectedGame,
    sortBy,
    setSortBy,
    sortByCategory: mapSortByToStatCategory(sortBy), // Return the mapped category separately
    searchTerm,
    setSearchTerm,
    showFriendsOnly,
    setShowFriendsOnly,
    selectedFriendIds,
    setSelectedFriendIds,
    timeFilter,
    setTimeFilter,
    selectedGroupId,
    setSelectedGroupId
  };
};
