
import React, { useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboardData } from '@/hooks/leaderboard/useLeaderboardData';
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader';
import LeaderboardFilters from '@/components/leaderboard/LeaderboardFilters';
import LeaderboardPlayersList from '@/components/leaderboard/LeaderboardPlayersList';
import LeaderboardStats from '@/components/leaderboard/LeaderboardStats';
import { games } from '@/utils/gameData';
import { SortByOption } from '@/types/leaderboard';

const Leaderboard = () => {
  const { user } = useAuth();
  
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
    setSelectedGroupId,
    filteredAndSortedPlayers,
    isLoading,
    scoresData,
    friends,
    friendGroups
  } = useLeaderboardData(user?.id);

  // Set default game to the first game in the list if none is selected
  useEffect(() => {
    if (selectedGame === 'all' && games.length > 0) {
      setSelectedGame(games[0].id);
    }
  }, [selectedGame, setSelectedGame]);
  
  // Find the current game object to display the game name in the header
  const currentGame = games.find(game => game.id === selectedGame);
  const gameTitle = currentGame ? currentGame.name : 'Game';
  
  // Generate subtitle based on time filter
  const subtitle = timeFilter === 'today' 
    ? "See who's winning today" 
    : "See who's winning overall";
  
  // Generate a more specific subtitle if filtering by a group
  let filterSubtitle = '';
  if (showFriendsOnly) {
    if (selectedGroupId) {
      const group = friendGroups?.find(g => g.id === selectedGroupId);
      filterSubtitle = group ? `Filtering by group: ${group.name}` : '';
    } else if (selectedFriendIds.length > 0) {
      filterSubtitle = `Filtering by ${selectedFriendIds.length} selected friends`;
    } else {
      filterSubtitle = 'Filtering by all friends';
    }
  }
  
  // Add message about player limit
  const limitMessage = filteredAndSortedPlayers.length === 25 
    ? "Showing top 25 players" 
    : "";
  
  // Debug outputs for leaderboard data
  console.log('Leaderboard.tsx - timeFilter:', timeFilter);
  console.log('Leaderboard.tsx - filtered players count:', filteredAndSortedPlayers.length);
  console.log('Leaderboard.tsx - scores data count:', scoresData?.length || 0);
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-3 sm:px-6 max-w-7xl mx-auto">
        <LeaderboardHeader 
          title={`${gameTitle} Leaderboard`}
          subtitle={subtitle}
          extraText={filterSubtitle || limitMessage}
        />
        
        <div className="glass-card rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 animate-slide-up" style={{animationDelay: '100ms'}}>
          <LeaderboardFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showFriendsOnly={showFriendsOnly}
            setShowFriendsOnly={setShowFriendsOnly}
            selectedFriendIds={selectedFriendIds}
            setSelectedFriendIds={setSelectedFriendIds}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            selectedGame={selectedGame}
            setSelectedGame={setSelectedGame}
            sortBy={sortBy}
            setSortBy={(value: SortByOption) => setSortBy(value)}
            friendsList={friends}
            friendGroups={friendGroups}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
          />
          
          <LeaderboardPlayersList
            players={filteredAndSortedPlayers}
            isLoading={isLoading}
            selectedGame={selectedGame}
            showFriendsOnly={showFriendsOnly}
            setShowFriendsOnly={setShowFriendsOnly}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
        </div>
        
        <LeaderboardStats
          timeFilter={timeFilter}
          isLoading={isLoading}
          players={filteredAndSortedPlayers}
          selectedGame={selectedGame}
          totalScoresCount={scoresData?.length || 0}
          rawScoresData={scoresData || []}
          sortBy={sortByCategory}
        />
      </main>
    </div>
  );
};

export default Leaderboard;
