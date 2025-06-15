import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';

// Helper function to calculate average score
const calculateAverage = (scores: Score[]): number | null => {
  if (scores.length === 0) return null;
  const total = scores.reduce((sum, score) => sum + score.value, 0);
  return total / scores.length;
};

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const [showAddScore, setShowAddScore] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const queryClient = useQueryClient();
  
  const {
    game,
    scores,
    isLoading,
    bestScore,
    friends,
    friendScores,
    friendScoresLoading,
    refreshFriends,
    averageScore
  } = useGameData({ gameId });
  
  const [localScores, setLocalScores] = useState<Score[]>([]);
  const [localBestScore, setLocalBestScore] = useState<number | null>(null);
  
  useEffect(() => {
    // Only set initial state if localScores is empty and hook data is available
    if (localScores.length === 0 && scores.length > 0) {
      setLocalScores(scores);
    }
    // Only set initial best score if not set locally and hook data is available
    if (localBestScore === null && bestScore !== null) {
        setLocalBestScore(bestScore);
    }

  }, [scores, bestScore, user?.id]);
  
  const handleAddScore = useCallback((newScore: Score) => {
    // Update local state for "Your Scores"
    let updatedScores = [...localScores];
    const existingScoreIndex = updatedScores.findIndex(s => s.id === newScore.id);
    if (existingScoreIndex >= 0) {
      updatedScores[existingScoreIndex] = newScore;
    } else {
      updatedScores = [newScore, ...updatedScores];
    }
    setLocalScores(updatedScores);
    
    // Update local best score
    if (newScore.gameId === 'wordle' || newScore.gameId === 'mini-crossword') {
      setLocalBestScore(prev => prev === null ? newScore.value : Math.min(prev ?? Infinity, newScore.value));
    } else {
      setLocalBestScore(prev => prev === null ? newScore.value : Math.max(prev ?? -Infinity, newScore.value));
    }

    // Invalidate queries to ensure server state is updated
    queryClient.invalidateQueries({ queryKey: ['game-scores'] });
    queryClient.invalidateQueries({ queryKey: ['friend-scores'] });
    queryClient.invalidateQueries({ queryKey: ['game-stats'] });
    queryClient.invalidateQueries({ queryKey: ['all-scores'] });
    
    // Trigger refresh for useGroupScores data (Today page)
    if (refreshFriends) refreshFriends();
    
  }, [localScores, user, queryClient, gameId, refreshFriends]);
  
  const handleScoreDeleted = useCallback((scoreId: string) => {
    // Create the updated array first
    const updatedScores = localScores.filter(score => score.id !== scoreId);
    setLocalScores(updatedScores);
    
    // Invalidate relevant queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['game-scores'] });
    queryClient.invalidateQueries({ queryKey: ['friend-scores'] });
    queryClient.invalidateQueries({ queryKey: ['game-stats'] });
    queryClient.invalidateQueries({ queryKey: ['all-scores'] });
    
    // Trigger refresh for useGroupScores data (Today page)
    if (refreshFriends) refreshFriends();
    
  }, [localScores, user, queryClient, refreshFriends]);
  
  // Calculate display values using useMemo for stability
  const displayScores = useMemo(() => localScores.length > 0 ? localScores : scores, [localScores, scores]);
  const displayBestScore = useMemo(() => localBestScore !== null ? localBestScore : bestScore, [localBestScore, bestScore]);
  const displayAverageScore = useMemo(() => {
      // Prioritize calculation from localScores once populated
      if (localScores.length > 0) {
          return calculateAverage(localScores);
      }
      // Fallback to hook's average only during initial load phase
      return averageScore;
  }, [localScores, averageScore]);
  
  // Get latest score from displayScores (which includes local updates)
  const latestScore = displayScores.length > 0 
    ? displayScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : undefined;
  
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
      
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <GameDetailHeader 
          game={game}
          user={user}
          onAddScore={() => setShowAddScore(true)}
          latestScore={latestScore}
          averageScore={displayAverageScore}
          bestScore={displayBestScore}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="friends">Friend Scores</TabsTrigger>
                  <TabsTrigger value="scores">Your Scores</TabsTrigger>
                </TabsList>
                
                {activeTab === 'friends' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 w-full sm:w-auto"
                    onClick={() => setShowConnectionsModal(true)}
                  >
                    <Users className="w-4 h-4" />
                    <span>Manage Friends</span>
                  </Button>
                )}
              </div>
              
              <TabsContent value="friends">
                <FriendScoresList 
                  game={game}
                  friends={friends}
                  friendScores={friendScores}
                  isLoading={friendScoresLoading}
                  onManageFriends={() => setShowConnectionsModal(true)}
                  onRefreshFriends={refreshFriends}
                  hideRefreshButton={true}
                />
              </TabsContent>
              
              <TabsContent value="scores" className="space-y-4">
                <ScoreList 
                  scores={displayScores}
                  game={game}
                  onAddScore={() => setShowAddScore(true)}
                  user={user}
                  onScoreDeleted={handleScoreDeleted}
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
          existingScores={displayScores}
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
