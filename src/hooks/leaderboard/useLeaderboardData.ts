
import { useEffect } from 'react';
import { processLeaderboardData, filterAndSortPlayers } from '@/utils/leaderboard';
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
    sortByCategory,
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
      
      // Count today's scores
      const todayScores = scoresData.filter(score => score.isToday);
      console.log('Today\'s scores count:', todayScores.length);
      
      // Log scores by game type for selected game
      if (selectedGame && selectedGame !== 'all') {
        const selectedGameScores = scoresData.filter(s => s.game_id === selectedGame);
        console.log(`Scores for ${selectedGame}:`, selectedGameScores.length);
        
        // Count today's scores for selected game
        const todayGameScores = selectedGameScores.filter(s => s.isToday);
        console.log(`Today's scores for ${selectedGame}:`, todayGameScores.length);
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
  
  // Debug - check today's scores in processed data
  useEffect(() => {
    const playersWithTodayScores = leaderboardData.filter(p => p.today_score !== null);
    console.log('Players with today scores after processing:', playersWithTodayScores.length);
    
    if (timeFilter === 'today') {
      const playersInTodayView = filteredAndSortedPlayers.filter(p => p.today_score !== null);
      console.log('Players with today scores in filtered results:', playersInTodayView.length);
    }
  }, [leaderboardData, filteredAndSortedPlayers, timeFilter]);
  
  const isLoading = isLoadingGameStats || isLoadingScores;
  
  return {
    selectedGame,
    setSelectedGame,
    sortBy,
    setSortBy,
    sortByCategory, // Include sortByCategory in the return value
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
