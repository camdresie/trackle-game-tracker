
import { useEffect } from 'react';
import { processLeaderboardData, filterAndSortPlayers } from '@/utils/leaderboard';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { useProfilesData } from './useProfilesData';
import { useGameStatsData } from './useGameStatsData';
import { useScoresData } from './useScoresData';
import { useLeaderboardFilters } from './useLeaderboardFilters';

export const useLeaderboardData = (userId: string | undefined) => {
  // Get leaderboard filters
  const {
    selectedGame,
    setSelectedGame,
    sortBy,
    setSortBy,
    sortByCategory,
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
  } = useLeaderboardFilters();
  
  // Get friends list
  const { friends } = useFriendsList();
  
  // Get friend groups
  const { friendGroups } = useFriendGroups(friends);
  
  // Get profiles data
  const { profilesData } = useProfilesData(userId);
  
  // Get game stats data
  const { gameStatsData, isLoadingGameStats } = useGameStatsData(userId, selectedGame, profilesData);
  
  // Get scores data - this will fetch ALL scores for the selected game
  const { scoresData, isLoadingScores } = useScoresData(userId, selectedGame);
  
  // Get friend IDs
  const friendIds = friends.map(friend => friend.id);
  
  // Get selected group member IDs
  const selectedGroupMemberIds = selectedGroupId
    ? (friendGroups.find(g => g.id === selectedGroupId)?.members?.map(m => m.id) || [])
    : [];
  
  // Process leaderboard data
  const leaderboardData = processLeaderboardData(
    gameStatsData,
    scoresData,
    selectedGame,
    friends,
    userId,
    profilesData
  );
  
  // Filter and sort players
  const filteredAndSortedPlayers = filterAndSortPlayers(
    leaderboardData,
    searchTerm,
    showFriendsOnly,
    selectedFriendIds,
    timeFilter,
    sortBy,
    selectedGame,
    userId,
    friendIds,
    selectedGroupMemberIds
  );
  
  const isLoading = isLoadingGameStats || isLoadingScores;
  
  return {
    selectedGame,
    setSelectedGame,
    sortBy,
    setSortBy,
    sortByCategory,
    searchTerm,
    setSearchTerm,
    showFriendsOnly,
    setShowFriendsOnly,
    selectedFriendIds,
    setSelectedFriendIds,
    timeFilter,
    setTimeFilter,
    selectedGroupId,
    setSelectedGroupId,
    filteredAndSortedPlayers,
    isLoading,
    scoresData,
    friends,
    friendGroups
  };
};
