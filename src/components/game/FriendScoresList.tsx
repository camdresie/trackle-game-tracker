
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, RefreshCw, Bug } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { Game, Score } from '@/utils/types';
import { toast } from 'sonner';
import { addFriendTestScores } from '@/services/testScoreHelpers';
import { useAuth } from '@/contexts/AuthContext';

interface FriendScoresListProps {
  game: Game;
  friends: { id: string; name: string; avatar?: string }[];
  friendScores: { [key: string]: Score[] };
  isLoading: boolean;
  onManageFriends: () => void;
  onRefreshFriends: () => Promise<void>;
  hideRefreshButton?: boolean;
}

const FriendScoresList = ({
  game,
  friends,
  friendScores,
  isLoading,
  onManageFriends,
  onRefreshFriends,
  hideRefreshButton = false
}: FriendScoresListProps) => {
  const { user, profile } = useAuth();
  const [addingTestScores, setAddingTestScores] = useState<{[key: string]: boolean}>({});
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced debug logging on every render
  useEffect(() => {
    console.log('FriendScoresList render - Game:', game?.id);
    console.log('FriendScoresList render - Friends:', friends);
    console.log('FriendScoresList render - Friend scores object keys:', Object.keys(friendScores));
    
    // Log each friend's scores individually
    friends.forEach(friend => {
      const scores = friendScores[friend.id] || [];
      console.log(`Friend ${friend.name} (${friend.id}) has ${scores.length} scores:`, 
        scores.length > 0 ? scores : 'No scores found');
    });
  }, [friends, friendScores, game]);
  
  // Check if there are any friend scores at all (with more detailed logging)
  const hasAnyScores = Object.values(friendScores).some(scores => scores && scores.length > 0);
  console.log('FriendScoresList - Has any scores:', hasAnyScores);
  console.log('FriendScoresList - Detailed scores:', Object.entries(friendScores).map(([id, scores]) => ({
    friendId: id,
    scoreCount: scores?.length || 0,
    scores: scores || []
  })));
  
  // Calculate stats for each friend
  const getFriendStats = (friendId: string) => {
    const scores = friendScores[friendId] || [];
    console.log(`Calculating stats for friend ${friendId}, scores:`, scores);
    
    if (scores.length === 0) {
      return { bestScore: 0, totalScore: 0, averageScore: 0, totalGames: 0 };
    }
    
    const totalGames = scores.length;
    const totalScore = scores.reduce((sum, score) => sum + score.value, 0);
    const averageScore = totalGames > 0 ? totalScore / totalGames : 0;
    
    let bestScore = scores[0]?.value || 0;
    if (game.id === 'wordle') {
      // For Wordle, lower is better
      bestScore = Math.min(...scores.map(s => s.value));
    } else {
      // For other games, higher is better
      bestScore = Math.max(...scores.map(s => s.value));
    }
    
    const stats = { bestScore, totalScore, averageScore, totalGames };
    console.log(`Stats for friend ${friendId}:`, stats);
    return stats;
  };
  
  const handleAddTestScores = async (friendId: string) => {
    if (!user || !game) return;
    
    setAddingTestScores(prev => ({ ...prev, [friendId]: true }));
    
    try {
      console.log(`Adding test scores for friend ${friendId} and game ${game.id}`);
      const result = await addFriendTestScores(game.id, friendId, user.id);
      
      if (result.success) {
        toast.success("Test scores added successfully");
        // Refresh friend scores after adding test data
        await onRefreshFriends();
      } else {
        console.error("Failed to add test scores:", result.error);
        toast.error("Failed to add test scores");
      }
    } catch (error) {
      console.error("Error adding test scores:", error);
      toast.error("Error adding test scores");
    } finally {
      setAddingTestScores(prev => ({ ...prev, [friendId]: false }));
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshFriends();
      toast.success("Friend scores refreshed");
    } catch (error) {
      console.error("Error refreshing friend scores:", error);
      toast.error("Failed to refresh friend scores");
    } finally {
      setRefreshing(false);
    }
  };

  // Create a list with the current user first (if available), followed by friends
  const allPlayers = user && profile 
    ? [{ 
        id: user.id, 
        name: profile.full_name || profile.username || 'You', 
        avatar: profile.avatar_url, 
        isCurrentUser: true 
      }, ...friends]
    : [...friends];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Friend Scores</h2>
        {!hideRefreshButton && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Refresh</span>
            </Button>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading friend scores...</p>
        </div>
      ) : allPlayers.length > 0 ? (
        <div className="space-y-4">
          {allPlayers.map((player, index) => {
            const stats = getFriendStats(player.id);
            const scores = friendScores[player.id] || [];
            const hasScores = scores.length > 0;
            
            return (
              <div key={player.id} className="space-y-2">
                <PlayerCard 
                  player={{
                    id: player.id,
                    name: 'isCurrentUser' in player ? `${player.name} (You)` : player.name,
                    avatar: player.avatar
                  }}
                  scores={scores}
                  game={game}
                  stats={stats}
                  rank={index + 1}
                  className={'isCurrentUser' in player ? "border-2 border-primary/30" : undefined}
                />
                
                {!hasScores && !('isCurrentUser' in player) && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTestScores(player.id)}
                      disabled={addingTestScores[player.id]}
                      className="gap-1"
                    >
                      {addingTestScores[player.id] ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Adding test scores...
                        </>
                      ) : (
                        <>
                          <Bug className="w-3 h-3 mr-1" />
                          Add test scores
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          
          {!hasAnyScores && (
            <div className="bg-secondary/30 rounded-lg p-4 text-sm text-center text-muted-foreground mt-4">
              <p>No scores found for your friends yet</p>
              <p className="mt-1">Add test scores to see how they would appear</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary/20 rounded-xl">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No friends yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Add friends to see their scores and compare your progress with theirs.
          </p>
          <Button onClick={onManageFriends}>Manage Friends</Button>
        </div>
      )}
    </div>
  );
};

export default FriendScoresList;
