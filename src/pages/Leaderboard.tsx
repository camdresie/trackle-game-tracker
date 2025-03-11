
import React from 'react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader';
import LeaderboardFilters from '@/components/leaderboard/LeaderboardFilters';
import LeaderboardPlayersList from '@/components/leaderboard/LeaderboardPlayersList';
import LeaderboardStats from '@/components/leaderboard/LeaderboardStats';

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
    timeFilter,
    setTimeFilter,
    filteredAndSortedPlayers,
    isLoading,
    scoresData
  } = useLeaderboardData(user?.id);
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <LeaderboardHeader 
          title="Leaderboard" 
          subtitle="See who's winning across all games"
        />
        
        <div className="glass-card rounded-xl p-5 mb-6 animate-slide-up" style={{animationDelay: '100ms'}}>
          <LeaderboardFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showFriendsOnly={showFriendsOnly}
            setShowFriendsOnly={setShowFriendsOnly}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            selectedGame={selectedGame}
            setSelectedGame={setSelectedGame}
            sortBy={sortBy}
            setSortBy={setSortBy}
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
        />
      </main>
    </div>
  );
};

export default Leaderboard;
