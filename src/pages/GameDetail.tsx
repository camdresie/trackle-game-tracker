import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NavBar from '@/components/NavBar';
import ScoreChart from '@/components/ScoreChart';
import AddScoreModal from '@/components/AddScoreModal';
import GameDetailHeader from '@/components/game/GameDetailHeader';
import GameStatCards from '@/components/game/GameStatCards';
import ScoreList from '@/components/game/ScoreList';
import FriendScoresList from '@/components/game/FriendScoresList';
import ConnectionsModal from '@/components/ConnectionsModal';
import { useAuth } from '@/contexts/AuthContext';
import { useGameData } from '@/hooks/useGameData';
import { Score } from '@/utils/types';
import { Users } from 'lucide-react';

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const [showAddScore, setShowAddScore] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('scores');
  
  const {
    game,
    scores,
    isLoading,
    bestScore,
    friends,
    friendScores
  } = useGameData({ gameId });
  
  // We need to create local state to update the UI without refetching
  const [localScores, setLocalScores] = useState<Score[]>([]);
  const [localBestScore, setLocalBestScore] = useState<number | null>(null);
  
  // Update local state when the fetched data changes
  useEffect(() => {
    setLocalScores(scores);
    setLocalBestScore(bestScore);
  }, [scores, bestScore]);
  
  const handleAddScore = (newScore: Score) => {
    // Manually update the UI with the new score without having to refetch everything
    setLocalScores(prev => [newScore, ...prev]);
    
    // Update best score
    if (newScore.gameId === 'wordle') {
      setLocalBestScore(prev => prev === null ? newScore.value : Math.min(prev, newScore.value));
    } else {
      setLocalBestScore(prev => prev === null ? newScore.value : Math.max(prev, newScore.value));
    }
  };
  
  // Use the local state or fallback to the fetched state
  const displayScores = localScores.length > 0 ? localScores : scores;
  const displayBestScore = localBestScore !== null ? localBestScore : bestScore;
  
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

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
        <GameDetailHeader 
          game={game}
          user={user}
          onAddScore={() => setShowAddScore(true)}
        />
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading game data...</div>
          </div>
        ) : (
          <>
            <GameStatCards 
              game={game}
              scores={displayScores}
              bestScore={displayBestScore}
            />
            
            {displayScores.length > 0 && (
              <div className="glass-card rounded-xl p-4 mb-8 overflow-hidden">
                <h2 className="text-xl font-semibold mb-4">Score History</h2>
                <div className="h-60">
                  <ScoreChart 
                    scores={displayScores.slice(-30)} 
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
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="scores">Your Scores</TabsTrigger>
                  <TabsTrigger value="friends">Friend Scores</TabsTrigger>
                </TabsList>
                
                {activeTab === 'friends' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => setShowConnectionsModal(true)}
                  >
                    <Users className="w-4 h-4" />
                    <span>Manage Friends</span>
                  </Button>
                )}
              </div>
              
              <TabsContent value="scores" className="space-y-4">
                <ScoreList 
                  scores={displayScores}
                  game={game}
                  onAddScore={() => setShowAddScore(true)}
                  user={user}
                />
              </TabsContent>
              
              <TabsContent value="friends">
                <FriendScoresList 
                  game={game}
                  friends={friends}
                  friendScores={friendScores}
                  onManageFriends={() => setShowConnectionsModal(true)}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      
      {showAddScore && game && (
        <AddScoreModal
          open={showAddScore}
          onOpenChange={setShowAddScore}
          game={game}
          onAddScore={handleAddScore}
        />
      )}
      
      {showConnectionsModal && user && (
        <ConnectionsModal
          open={showConnectionsModal}
          onOpenChange={setShowConnectionsModal}
          currentPlayerId={user.id}
        />
      )}
    </div>
  );
};

export default GameDetail;
