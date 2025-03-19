
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Game } from '@/utils/types';
import { Gamepad2 } from 'lucide-react';

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
  
  // Handler for game selection in the dropdown
  const handleGameSelect = (gameId: string) => {
    const game = gamesList.find(g => g.id === gameId) || null;
    setSelectedGame(game);
  };
  
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
            <div className="mb-4">
              <Select
                value={selectedGame?.id || ""}
                onValueChange={handleGameSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a game to view group performance">
                    {selectedGame ? (
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full ${selectedGame.color} mr-2`}></span>
                        {selectedGame.name}
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground">
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        Select a game
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {gamesList.map((game: Game) => (
                    <SelectItem key={game.id} value={game.id}>
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full ${game.color} mr-2`}></span>
                        {game.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
