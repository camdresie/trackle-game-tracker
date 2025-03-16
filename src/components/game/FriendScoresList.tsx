
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, RefreshCw } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { Game, Score } from '@/utils/types';
import { toast } from 'sonner';
import { addFriendTestScores } from '@/services/gameStatsService';
import { useAuth } from '@/contexts/AuthContext';

interface FriendScoresListProps {
  game: Game;
  friends: { id: string; name: string; avatar?: string }[];
  friendScores: { [key: string]: Score[] };
  isLoading: boolean;
  onManageFriends: () => void;
  onRefreshFriends: () => Promise<void>;
}

const FriendScoresList = ({
  game,
  friends,
  friendScores,
  isLoading,
  onManageFriends,
  onRefreshFriends
}: FriendScoresListProps) => {
  const { user } = useAuth();
  const [addingTestScores, setAddingTestScores] = useState<{[key: string]: boolean}>({});
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced debug logging
  console.log('FriendScoresList render - Friends:', friends.length);
  console.log('FriendScoresList render - Friend score keys:', Object.keys(friendScores).length);
  
  // Check if there are any friend scores at all (with more detailed logging)
  const hasAnyScores = Object.values(friendScores).some(scores => scores && scores.length > 0);
  console.log('FriendScoresList render - Has any scores:', hasAnyScores);
  console.log('FriendScoresList render - Detailed scores:', Object.entries(friendScores).map(([id, scores]) => ({
    friendId: id,
    scoreCount: scores?.length || 0,
    scores: scores || []
  })));
  
  // Calculate stats for each friend
  const getFriendStats = (friendId: string) => {
    const scores = friendScores[friendId] || [];
    
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
    
    return { bestScore, totalScore, averageScore, totalGames };
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Friend Scores</h2>
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
      
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading friend scores...</p>
        </div>
      ) : friends.length > 0 ? (
        <div className="space-y-4">
          {friends.map((friend, index) => {
            const stats = getFriendStats(friend.id);
            const scores = friendScores[friend.id] || [];
            const hasScores = scores.length > 0;
            
            return (
              <div key={friend.id} className="space-y-2">
                <PlayerCard 
                  player={friend}
                  scores={scores}
                  game={game}
                  stats={stats}
                  rank={index + 1}
                />
                
                {!hasScores && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTestScores(friend.id)}
                      disabled={addingTestScores[friend.id]}
                    >
                      {addingTestScores[friend.id] ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Adding test scores...
                        </>
                      ) : (
                        "Add test scores"
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
