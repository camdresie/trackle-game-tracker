import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, RefreshCw } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { Game, Score } from '@/utils/types';
import { toast } from 'sonner';
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
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced debug logging on every render
  useEffect(() => {
    console.log('FriendScoresList render - Game:', game?.id);
    console.log('FriendScoresList render - Friends count:', friends.length);
    console.log('FriendScoresList render - Friends:', friends.map(f => ({ id: f.id, name: f.name })));
    console.log('FriendScoresList render - Friend scores keys:', Object.keys(friendScores));
    
    // Log each friend's scores individually
    friends.forEach(friend => {
      const scores = friendScores[friend.id] || [];
      console.log(`Friend ${friend.name} (${friend.id}) has ${scores.length} scores:`, 
        scores.length > 0 ? scores : 'No scores found');
    });

    // Log any friend scores that are missing from the friendScores object
    friends.forEach(friend => {
      if (!friendScores[friend.id]) {
        console.warn(`Friend ${friend.name} (${friend.id}) has no entry in friendScores object`);
      }
    });

    // Log any scores in friendScores that don't belong to a friend
    Object.keys(friendScores).forEach(userId => {
      const friend = friends.find(f => f.id === userId);
      if (!friend && userId !== user?.id) {
        console.warn(`Found scores for user ${userId} but they are not in the friends list`);
      }
    });
  }, [friends, friendScores, game, user?.id]);
  
  // Check if there are any friend scores at all (with more detailed logging)
  const hasAnyScores = Object.values(friendScores).some(scores => scores && scores.length > 0);
  console.log('FriendScoresList - Has any scores:', hasAnyScores);
  
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
      // For other games including Betweenle, higher is better
      bestScore = Math.max(...scores.map(s => s.value));
    }
    
    const stats = { bestScore, totalScore, averageScore, totalGames };
    console.log(`Stats for friend ${friendId}:`, stats);
    return stats;
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing friend scores...');
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
  let allPlayers = user && profile 
    ? [{ 
        id: user.id, 
        name: profile.full_name || profile.username || 'You', 
        avatar: profile.avatar_url, 
        isCurrentUser: true 
      }, ...friends]
    : [...friends];
    
  // Sort players based on their scores
  // Only sort when there are scores to sort by
  const hasScores = Object.values(friendScores).some(scores => scores && scores.length > 0);
  
  if (hasScores) {
    allPlayers = [...allPlayers].sort((a, b) => {
      const statsA = getFriendStats(a.id);
      const statsB = getFriendStats(b.id);
      
      // If a player has no scores, they should be sorted to the bottom
      if (statsA.totalGames === 0 && statsB.totalGames === 0) return 0;
      if (statsA.totalGames === 0) return 1;
      if (statsB.totalGames === 0) return -1;
      
      // Sort by average score based on game type
      if (['wordle', 'mini-crossword', 'connections', 'framed', 'nerdle'].includes(game.id)) {
        // For games where lower is better
        return statsA.averageScore - statsB.averageScore;
      } else {
        // For games where higher is better (including Betweenle)
        return statsB.averageScore - statsA.averageScore;
      }
    });
  }

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
            const scores = friendScores[player.id] || [];
            const hasScores = scores.length > 0;
            const stats = getFriendStats(player.id);
            
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
              </div>
            );
          })}
          
          {!hasAnyScores && (
            <div className="bg-secondary/30 rounded-lg p-4 text-sm text-center text-muted-foreground mt-4">
              <p>No scores found for your friends yet</p>
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
