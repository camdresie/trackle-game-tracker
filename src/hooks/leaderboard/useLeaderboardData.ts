
import { useEffect } from 'react';
import { processLeaderboardData, filterAndSortPlayers } from '@/utils/leaderboardUtils';
import { useFriendsList } from '@/hooks/useFriendsList';
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
    searchTerm,
    setSearchTerm,
    showFriendsOnly,
    setShowFriendsOnly,
    selectedFriendIds,
    setSelectedFriendIds,
    timeFilter,
    setTimeFilter
  } = useLeaderboardFilters();
  
  // Get friends list
  const { friends } = useFriendsList();
  
  // Get profiles data
  const { profilesData } = useProfilesData(userId);
  
  // Get game stats data
  const { gameStatsData, isLoadingGameStats } = useGameStatsData(userId, selectedGame, profilesData);
  
  // Get scores data - this will fetch ALL scores for the selected game
  const { scoresData, isLoadingScores } = useScoresData(userId, selectedGame);
  
  // Debug check for data
  useEffect(() => {
    if (profilesData) {
      const camdresie = profilesData.find(p => p.username === 'camdresie');
      console.log('Found camdresie in profiles?', camdresie ? 'YES' : 'NO', camdresie);
    }
    
    if (scoresData) {
      console.log('Total scores retrieved:', scoresData.length);
      
      // Log scores by game type for selected game
      if (selectedGame && selectedGame !== 'all') {
        const selectedGameScores = scoresData.filter(s => s.game_id === selectedGame);
        console.log(`Scores for ${selectedGame}:`, selectedGameScores.length);
      }
    }
  }, [profilesData, scoresData, selectedGame]);
  
  // Get friend IDs
  const friendIds = friends.map(friend => friend.id);
  
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
    friendIds
  );
  
  // Check if camdresie exists in our final data
  useEffect(() => {
    const camdresieInLeaderboard = leaderboardData.find(p => p.username === 'camdresie');
    console.log('camdresie in processed leaderboard?', camdresieInLeaderboard ? 'YES' : 'NO', camdresieInLeaderboard);
    
    const camdresieInFilteredPlayers = filteredAndSortedPlayers.find(p => p.username === 'camdresie');
    console.log('camdresie in filtered players?', camdresieInFilteredPlayers ? 'YES' : 'NO', camdresieInFilteredPlayers);
  }, [leaderboardData, filteredAndSortedPlayers]);
  
  const isLoading = isLoadingGameStats || isLoadingScores;
  
  return {
    selectedGame,
    setSelectedGame,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    showFriendsOnly,
    setShowFriendsOnly,
    selectedFriendIds,
    setSelectedFriendIds,
    timeFilter,
    setTimeFilter,
    filteredAndSortedPlayers,
    isLoading,
    scoresData,
    friends
  };
};
