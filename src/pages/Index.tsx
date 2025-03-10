
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Calendar, Plus, UsersRound } from 'lucide-react';
import NavBar from '@/components/NavBar';
import GameCard from '@/components/GameCard';
import AddScoreModal from '@/components/AddScoreModal';
import AddGameModal from '@/components/AddGameModal';
import ConnectionsModal from '@/components/ConnectionsModal';
import { Game, Score } from '@/utils/types';
import { games, sampleScores, getLatestScoreByGameAndPlayer, calculateAverageScore, calculateBestScore, addGame } from '@/utils/gameData';

const Index = () => {
  const [currentPlayerId, setCurrentPlayerId] = useState('p1'); // Default to first player
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showAddScore, setShowAddScore] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [scores, setScores] = useState<Score[]>(sampleScores);
  const [gamesList, setGamesList] = useState<Game[]>(games);
  
  const handleAddScore = (newScore: Score) => {
    setScores((prevScores) => [...prevScores, newScore]);
  };
  
  const handleAddGame = (newGameData: Omit<Game, 'id' | 'isCustom'>) => {
    const newGame = addGame(newGameData);
    setGamesList([...gamesList]);
  };
  
  const getTodaysGames = () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    return scores.filter(score => score.date === today && score.playerId === currentPlayerId);
  };
  
  const todaysGames = getTodaysGames();
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <section className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Game Tracker</h1>
              <p className="text-muted-foreground">Track your daily game scores and compare with friends</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowConnections(true)}
                className="flex items-center gap-2"
              >
                <UsersRound className="w-4 h-4" />
                Friends
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowAddGame(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Game
              </Button>
              
              <Button 
                onClick={() => {
                  setSelectedGame(gamesList[0]);
                  setShowAddScore(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Score
              </Button>
            </div>
          </div>
          
          {todaysGames.length > 0 ? (
            <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Today's Games</h2>
                <p className="text-sm text-muted-foreground">
                  You've played {todaysGames.length} game{todaysGames.length !== 1 ? 's' : ''} today
                </p>
              </div>
              <div className="flex-1"></div>
              <ScrollArea className="w-full sm:w-auto max-w-full">
                <div className="flex gap-2 pb-1">
                  {todaysGames.map(score => {
                    const game = gamesList.find(g => g.id === score.gameId);
                    if (!game) return null;
                    
                    return (
                      <div 
                        key={score.id}
                        className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full min-w-max"
                      >
                        <div className={`w-2 h-2 rounded-full ${game.color}`}></div>
                        <span className="text-sm font-medium">{game.name}</span>
                        <span className="text-sm">{score.value}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="p-2 bg-muted rounded-lg">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-medium">No games played today</h2>
                <p className="text-sm text-muted-foreground">Add your first score to start tracking</p>
              </div>
            </div>
          )}
        </section>
        
        <section className="mb-8 animate-slide-up" style={{animationDelay: '100ms'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Your Games
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gamesList.map(game => {
              const gameScores = scores.filter(
                score => score.gameId === game.id && score.playerId === currentPlayerId
              );
              const latestScore = getLatestScoreByGameAndPlayer(game.id, currentPlayerId);
              const averageScore = calculateAverageScore(gameScores);
              const bestScore = calculateBestScore(gameScores, game);
              
              return (
                <GameCard 
                  key={game.id}
                  game={game}
                  latestScore={latestScore}
                  averageScore={averageScore}
                  bestScore={bestScore}
                />
              );
            })}
          </div>
        </section>
        
        {selectedGame && (
          <AddScoreModal 
            open={showAddScore}
            onOpenChange={setShowAddScore}
            game={selectedGame}
            playerId={currentPlayerId}
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
          currentPlayerId={currentPlayerId}
        />
      </main>
    </div>
  );
};

export default Index;
