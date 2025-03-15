
import React, { useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader';
import LeaderboardFilters from '@/components/leaderboard/LeaderboardFilters';
import LeaderboardPlayersList from '@/components/leaderboard/LeaderboardPlayersList';
import LeaderboardStats from '@/components/leaderboard/LeaderboardStats';
import { games } from '@/utils/gameData';

const Leaderboard = () => {
  const { user } = useAuth();
  
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
    setTimeFilter,
    filteredAndSortedPlayers,
    isLoading,
    scoresData,
    friends
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
  
  // Debug outputs for leaderboard data
  console.log('Leaderboard.tsx - timeFilter:', timeFilter);
  console.log('Leaderboard.tsx - filtered players count:', filteredAndSortedPlayers.length);
  console.log('Leaderboard.tsx - scores data count:', scoresData?.length || 0);
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <LeaderboardHeader 
          title={`${gameTitle} Leaderboard`}
          subtitle="See who's winning at this game"
        />
        
        <div className="glass-card rounded-xl p-5 mb-6 animate-slide-up" style={{animationDelay: '100ms'}}>
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
            setSortBy={setSortBy}
            friendsList={friends}
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
          scoresCount={scoresData?.length || 0}
          rawScoresData={scoresData || []}
        />
      </main>
    </div>
  );
};

export default Leaderboard;
