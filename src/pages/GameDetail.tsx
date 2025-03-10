
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Calendar, 
  ChevronLeft, 
  Plus, 
  BarChart3, 
  Users,
  Star,
  Puzzle,
  Grid,
  LayoutGrid,
  Sword,
  Dices
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import ScoreChart from '@/components/ScoreChart';
import PlayerCard from '@/components/PlayerCard';
import AddScoreModal from '@/components/AddScoreModal';
import { Game, Score, Player } from '@/utils/types';
import { 
  games, 
  players, 
  sampleScores,
  getScoresByGameId, 
  getScoresByGameAndPlayer,
  calculateAverageScore,
  calculateBestScore
} from '@/utils/gameData';

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState('p1');
  const [showAddScore, setShowAddScore] = useState(false);
  
  useEffect(() => {
    if (!gameId) return;
    
    const foundGame = games.find(g => g.id === gameId);
    if (foundGame) {
      setGame(foundGame);
      setScores(getScoresByGameId(gameId));
    }
  }, [gameId]);
  
  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="pt-24 px-4 text-center">
          <p>Game not found</p>
          <Link to="/" className="text-accent underline mt-4 inline-block">
            Back to home
          </Link>
        </main>
      </div>
    );
  }
  
  const getIcon = () => {
    switch (game.icon) {
      case 'puzzle':
        return <Puzzle className="w-6 h-6 text-white" />;
      case 'grid':
        return <Grid className="w-6 h-6 text-white" />;
      case 'layout-grid':
        return <LayoutGrid className="w-6 h-6 text-white" />;
      case 'sword':
        return <Sword className="w-6 h-6 text-white" />;
      default:
        return <Dices className="w-6 h-6 text-white" />;
    }
  };
  
  const handleAddScore = (newScore: Score) => {
    setScores((prevScores) => [...prevScores, newScore]);
  };
  
  const currentPlayerScores = getScoresByGameAndPlayer(game.id, currentPlayerId);
  
  // Calculate player ranks based on their performance
  const getPlayerRanks = (): { player: Player; rank: number; totalScore: number }[] => {
    const playerScores = players.map(player => {
      const playerGameScores = getScoresByGameAndPlayer(game.id, player.id);
      
      // Different games have different scoring systems
      let totalScore = 0;
      if (game.id === 'wordle') {
        // For Wordle, lower is better
        totalScore = playerGameScores.length > 0 
          ? playerGameScores.reduce((sum, s) => sum + s.value, 0) / playerGameScores.length
          : Infinity;
      } else {
        // For other games, higher is better
        totalScore = playerGameScores.reduce((sum, s) => sum + s.value, 0);
      }
      
      return { player, totalScore };
    });
    
    // Sort players by score
    const sortedPlayers = [...playerScores].sort((a, b) => {
      if (game.id === 'wordle') {
        // For Wordle, lower is better
        return a.totalScore - b.totalScore;
      } else {
        // For other games, higher is better
        return b.totalScore - a.totalScore;
      }
    });
    
    // Assign ranks
    return sortedPlayers.map((ps, index) => ({
      player: ps.player,
      rank: index + 1,
      totalScore: ps.totalScore
    }));
  };
  
  const playerRanks = getPlayerRanks();
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-6 animate-slide-up">
          <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Games</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className={`p-4 rounded-xl ${game.color} w-16 h-16 flex items-center justify-center`}>
              {getIcon()}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{game.name}</h1>
              <p className="text-muted-foreground">{game.description}</p>
            </div>
            
            <Button 
              onClick={() => setShowAddScore(true)}
              className="sm:self-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Score
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{animationDelay: '100ms'}}>
          <div className="lg:col-span-2">
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="stats" className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>Your Stats</span>
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span>Leaderboard</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats" className="animate-fade-in mt-0">
                <div className="glass-card rounded-xl p-5 mb-6">
                  <h2 className="text-lg font-semibold mb-4">Performance History</h2>
                  <ScoreChart 
                    scores={currentPlayerScores} 
                    color={game.color.replace('bg-', '')} 
                    gameId={game.id}
                  />
                </div>
                
                <div className="glass-card rounded-xl p-5">
                  <h2 className="text-lg font-semibold mb-4">Recent Scores</h2>
                  
                  {currentPlayerScores.length > 0 ? (
                    <div className="space-y-3">
                      {[...currentPlayerScores]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10)
                        .map(score => (
                          <div 
                            key={score.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${game.color} flex items-center justify-center`}>
                                <span className="font-semibold text-white">{score.value}</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium">
                                  {new Date(score.date).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                {score.notes && (
                                  <p className="text-xs text-muted-foreground">{score.notes}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {new Date(score.date).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No scores recorded yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setShowAddScore(true)}
                      >
                        Add Your First Score
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="leaderboard" className="animate-fade-in mt-0">
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Player Rankings</h2>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      <Users className="w-3 h-3" />
                      <span>{players.length} Players</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {playerRanks.map(({ player, rank }) => (
                      <PlayerCard 
                        key={player.id}
                        player={player}
                        rank={rank}
                        scores={getScoresByGameAndPlayer(game.id, player.id)}
                        game={game}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <div className="glass-card rounded-xl p-5 mb-6">
              <h2 className="text-lg font-semibold mb-3">Your Stats</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Best Score</span>
                  </div>
                  <div className="text-2xl font-semibold">
                    {currentPlayerScores.length > 0 
                      ? calculateBestScore(currentPlayerScores, game) 
                      : '-'}
                  </div>
                </div>
                
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Average</span>
                  </div>
                  <div className="text-2xl font-semibold">
                    {currentPlayerScores.length > 0 
                      ? calculateAverageScore(currentPlayerScores) 
                      : '-'}
                  </div>
                </div>
                
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Plays</span>
                  </div>
                  <div className="text-2xl font-semibold">{currentPlayerScores.length}</div>
                </div>
                
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Your Rank</span>
                  </div>
                  <div className="text-2xl font-semibold">
                    {playerRanks.find(pr => pr.player.id === currentPlayerId)?.rank || '-'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-5">
              <h2 className="text-lg font-semibold mb-3">Top Players</h2>
              
              <div className="space-y-3">
                {playerRanks.slice(0, 3).map(({ player, rank }) => (
                  <div 
                    key={player.id} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      rank === 1 ? 'bg-amber-100 text-amber-600' :
                      rank === 2 ? 'bg-slate-100 text-slate-600' :
                      'bg-amber-50 text-amber-800'
                    }`}>
                      {rank}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {getScoresByGameAndPlayer(game.id, player.id).length} games played
                      </div>
                    </div>
                    
                    <div className="font-semibold">
                      {calculateBestScore(getScoresByGameAndPlayer(game.id, player.id), game)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {game && (
        <AddScoreModal 
          open={showAddScore}
          onOpenChange={setShowAddScore}
          game={game}
          playerId={currentPlayerId}
          onAddScore={handleAddScore}
        />
      )}
    </div>
  );
};

export default GameDetail;
