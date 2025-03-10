import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, CalendarDays, ListChecks, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import NavBar from '@/components/NavBar';
import ScoreChart from '@/components/ScoreChart';
import AddScoreModal from '@/components/AddScoreModal';
import { getGameById, getScoresByGameId, getScoresByGameAndPlayer, getPlayerById, getPlayerFriends } from '@/utils/gameData';
import { Score, Game, Player } from '@/utils/types';

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [currentPlayerId, setCurrentPlayerId] = useState('p1'); // Default player
  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [playerScores, setPlayerScores] = useState<Score[]>([]);
  const [showAddScore, setShowAddScore] = useState(false);
  const [activeTab, setActiveTab] = useState('scores');
  const [friends, setFriends] = useState<Player[]>([]);
  
  useEffect(() => {
    if (gameId) {
      const gameData = getGameById(gameId);
      if (gameData) {
        setGame(gameData);
        
        // Get all scores for this game
        const allScores = getScoresByGameId(gameId);
        setScores(allScores);
        
        // Get current player's scores
        const currentPlayerScores = getScoresByGameAndPlayer(gameId, currentPlayerId);
        setPlayerScores(currentPlayerScores);
        
        // Get friends
        setFriends(getPlayerFriends(currentPlayerId));
      }
    }
  }, [gameId, currentPlayerId]);
  
  const handleAddScore = (newScore: Score) => {
    setScores(prev => [...prev, newScore]);
    setPlayerScores(prev => [...prev, newScore]);
  };
  
  // If game is not found
  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Game not found</h1>
          <p className="mb-6">The game you're looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const bestScore = playerScores.length > 0
    ? game.id === 'wordle' 
      ? Math.min(...playerScores.map(s => s.value))
      : Math.max(...playerScores.map(s => s.value))
    : null;
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Games
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2.5 rounded-lg ${game.color}`}>
                {/* Icon would be here */}
              </div>
              <h1 className="text-3xl font-bold">{game.name}</h1>
            </div>
            <p className="text-muted-foreground max-w-lg mb-4">{game.description}</p>
          </div>
          
          <Button onClick={() => setShowAddScore(true)}>Add Today's Score</Button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>Best Score</span>
            </div>
            <div className="text-3xl font-bold">
              {bestScore !== null ? bestScore : '-'}
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span>Played</span>
            </div>
            <div className="text-3xl font-bold">
              {playerScores.length}
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <ListChecks className="w-4 h-4" />
              <span>Difficulty</span>
            </div>
            <div className="text-3xl font-bold">
              {/* Simple difficulty calculation based on scores */}
              {playerScores.length > 0 
                ? (game.id === 'wordle' && bestScore === 1) || 
                  (!['wordle', 'tightrope', 'quordle'].includes(game.id) && 
                  playerScores.some(s => s.value >= game.maxScore * 0.9))
                  ? 'Master'
                  : 'Regular'
                : '-'}
            </div>
          </div>
        </div>
        
        {playerScores.length > 0 && (
          <div className="glass-card rounded-xl p-4 mb-8 overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">Your Performance</h2>
            <div className="h-60">
              <ScoreChart 
                scores={playerScores.slice(-30)} 
                gameId={game.id} 
                color={game.color.replace('bg-', '')}
              />
            </div>
          </div>
        )}
        
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="glass-card rounded-xl p-4"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="scores">Your Scores</TabsTrigger>
            <TabsTrigger value="friends">Friend Scores</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scores" className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Your Score History</h2>
            
            {playerScores.length > 0 ? (
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {[...playerScores]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((score) => (
                      <div 
                        key={score.id}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-secondary rounded-md p-2 w-12 h-12 flex items-center justify-center">
                            <span className="text-xl font-bold">{score.value}</span>
                          </div>
                          <div>
                            <div className="font-medium">{formatDate(score.date)}</div>
                            {score.notes && (
                              <div className="text-sm text-muted-foreground">{score.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className={
                          (game.id === 'wordle' && score.value <= 3) || 
                          (!['wordle', 'tightrope', 'quordle'].includes(game.id) && score.value >= game.maxScore * 0.8)
                            ? 'text-emerald-500' 
                            : 'text-amber-500'
                        }>
                          {(game.id === 'wordle' && score.value <= 2)
                            ? 'Excellent'
                            : (game.id === 'wordle' && score.value <= 4) || 
                              (!['wordle', 'tightrope', 'quordle'].includes(game.id) && score.value >= game.maxScore * 0.7)
                              ? 'Good'
                              : 'Fair'}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">You haven't recorded any scores for this game yet</p>
                <Button onClick={() => setShowAddScore(true)}>Add Your First Score</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="friends">
            <h2 className="text-xl font-semibold mb-4">Friend Scores</h2>
            
            {friends.length > 0 ? (
              <div className="space-y-6">
                {friends.map(friend => {
                  const friendScores = getScoresByGameAndPlayer(game.id, friend.id);
                  const bestFriendScore = friendScores.length > 0
                    ? game.id === 'wordle'
                      ? Math.min(...friendScores.map(s => s.value))
                      : Math.max(...friendScores.map(s => s.value))
                    : null;
                  
                  return (
                    <div key={friend.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <h3 className="font-medium">{friend.name}</h3>
                        </div>
                        
                        <div className="text-sm">
                          Best: <span className="font-semibold">
                            {bestFriendScore !== null ? bestFriendScore : '-'}
                          </span>
                        </div>
                      </div>
                      
                      {friendScores.length > 0 ? (
                        <div className="h-32">
                          <ScoreChart 
                            scores={friendScores.slice(-20)} 
                            gameId={game.id}
                            color={game.color.replace('bg-', '')}
                            simplified={true}
                          />
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground bg-secondary/20 rounded-lg">
                          No scores recorded
                        </div>
                      )}
                      
                      <Separator />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">You haven't added any friends yet</p>
                <Link to="/">
                  <Button variant="outline">Add Friends</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      {showAddScore && (
        <AddScoreModal
          open={showAddScore}
          onOpenChange={setShowAddScore}
          game={game}
          onAddScore={handleAddScore}
        />
      )}
    </div>
  );
};

export default GameDetail;
