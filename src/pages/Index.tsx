
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import AddScoreModal from '@/components/AddScoreModal';
import AddGameModal from '@/components/AddGameModal';
import ConnectionsModal from '@/components/ConnectionsModal';
import { useAuth } from '@/contexts/AuthContext';
import { useHomeData } from '@/hooks/useHomeData';
import HomeHeader from '@/components/home/HomeHeader';
import TodaysGames from '@/components/home/TodaysGames';
import GamesGrid from '@/components/home/GamesGrid';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isLoading,
    gamesList,
    scores,
    todaysGames,
    selectedGame,
    setSelectedGame,
    showAddScore,
    setShowAddScore,
    showAddGame,
    setShowAddGame,
    showConnections,
    setShowConnections,
    handleAddScore,
    handleAddGame
  } = useHomeData();

  const handleShowAddScore = () => {
    if (gamesList.length > 0) {
      setSelectedGame(gamesList[0]);
      setShowAddScore(true);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <section className="mb-8 animate-slide-up">
          <HomeHeader 
            onShowAddGame={() => setShowAddGame(true)}
            onShowAddScore={handleShowAddScore}
            onShowConnections={() => setShowConnections(true)}
            gamesList={gamesList}
          />
          
          <TodaysGames 
            isLoading={isLoading}
            todaysGames={todaysGames}
            gamesList={gamesList}
          />
        </section>
        
        <GamesGrid
          isLoading={isLoading}
          gamesList={gamesList}
          scores={scores}
        />
        
        {selectedGame && (
          <AddScoreModal 
            open={showAddScore}
            onOpenChange={setShowAddScore}
            game={selectedGame}
            onAddScore={handleAddScore}
          />
        )}
        
        <AddGameModal
          open={showAddGame}
          onOpenChange={setShowAddGame}
          onAddGame={handleAddGame}
        />
        
        <ConnectionsModal
          open={showConnections}
          onOpenChange={setShowConnections}
          currentPlayerId={user?.id || ''}
        />
      </main>
    </div>
  );
};

export default Index;
