
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import AddScoreModal from '@/components/AddScoreModal';
import ConnectionsModal from '@/components/ConnectionsModal';
import GameSelectionModal from '@/components/GameSelectionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useHomeData } from '@/hooks/useHomeData';
import HomeHeader from '@/components/home/HomeHeader';
import TodaysGames from '@/components/home/TodaysGames';
import GamesGrid from '@/components/home/GamesGrid';
import GroupPerformance from '@/components/home/GroupPerformance';

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
    showGameSelection,
    setShowGameSelection,
    showConnections,
    setShowConnections,
    handleAddScore
  } = useHomeData();
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <section className="mb-8 animate-slide-up">
          <HomeHeader 
            onShowAddScore={() => setShowGameSelection(true)}
            onShowConnections={() => setShowConnections(true)}
            gamesList={gamesList}
          />
          
          <TodaysGames 
            isLoading={isLoading}
            todaysGames={todaysGames}
            gamesList={gamesList}
          />
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <GamesGrid
              isLoading={isLoading}
              gamesList={gamesList}
              scores={scores}
            />
          </div>
          <div className="lg:col-span-1">
            <GroupPerformance 
              selectedGame={selectedGame}
              todaysGames={todaysGames}
              className="h-full"
            />
          </div>
        </div>
        
        <GameSelectionModal
          open={showGameSelection}
          onOpenChange={setShowGameSelection}
          games={gamesList}
          onSelectGame={(game) => {
            setSelectedGame(game);
            setShowAddScore(true);
          }}
        />
        
        {selectedGame && (
          <AddScoreModal 
            open={showAddScore}
            onOpenChange={setShowAddScore}
            game={selectedGame}
            onAddScore={handleAddScore}
          />
        )}
        
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
