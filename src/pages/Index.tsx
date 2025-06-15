import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { GamepadIcon, Trophy } from 'lucide-react';
import NavBar from '@/components/NavBar';
import AddScoreModal from '@/components/AddScoreModal';
import ConnectionsModal from '@/components/ConnectionsModal';
import GameSelectionModal from '@/components/GameSelectionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useHomeData } from '@/hooks/useHomeData';
import HomeHeader from '@/components/home/HomeHeader';
import TodaysGames from '@/components/home/TodaysGames';
import GamesGrid from '@/components/home/GamesGrid';
import MyGamesGrid from '@/components/home/MyGamesGrid';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Game } from '@/utils/types';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-games');
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
    handleAddScore,
    handleDeleteScore
  } = useHomeData();
  
  // Check if there are any new games
  const hasNewGames = gamesList.some(game => game.isNew);
  
  // Filter scores for the currently selected game (for edit mode in modal)
  const selectedGameScores = selectedGame 
    ? scores.filter(score => score.gameId === selectedGame.id) 
    : [];
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-28 pb-12 px-2 sm:px-6 max-w-7xl mx-auto">
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
            onDeleteScore={handleDeleteScore}
          />
        </section>
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="inline-flex sm:inline-flex w-full sm:w-auto grid sm:grid-cols-none grid-cols-2 h-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <TabsTrigger value="my-games" className="inline-flex items-center justify-center gap-2">
                <Trophy className="h-4 w-4" />
                My Games
              </TabsTrigger>
              <TabsTrigger value="all-games" className="inline-flex items-center justify-center gap-2">
                <GamepadIcon className="h-4 w-4" />
                All Games
                {hasNewGames && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500"></span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4">
            {activeTab === 'my-games' ? (
              <MyGamesGrid
                isLoading={isLoading}
                gamesList={gamesList}
                scores={scores}
              />
            ) : (
              <GamesGrid
                isLoading={isLoading}
                gamesList={gamesList}
                scores={scores}
              />
            )}
          </div>
        </div>
        
        <GameSelectionModal
          open={showGameSelection}
          onOpenChange={setShowGameSelection}
          games={gamesList}
          scores={scores}
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
            existingScores={selectedGameScores}
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
