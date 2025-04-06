import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, RefreshCw } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { Game, Score } from '@/utils/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Player {
  id: string;
  name: string;
  avatar?: string;
  isCurrentUser?: boolean;
}

interface FriendScoresListProps {
  game: Game;
  friends: Player[];
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
  
  // Check if there are any friend scores at all
  const hasAnyScores = Object.values(friendScores).some(scores => scores && scores.length > 0);
  
  // Calculate stats for each friend
  const getFriendStats = (friendId: string) => {
    const scores = friendScores[friendId] || [];
    
    // If we have no scores, return zero stats
    if (scores.length === 0) {
      return { bestScore: 0, totalScore: 0, averageScore: 0, totalGames: 0 };
    }
    
    const totalGames = scores.length;
    const totalScore = scores.reduce((sum, score) => sum + score.value, 0);
    const averageScore = totalGames > 0 ? totalScore / totalGames : 0;
    
    let bestScore = scores[0]?.value || 0;
    if (game.id === 'wordle' || game.id === 'mini-crossword') {
      // For Wordle and mini-crossword, lower is better
      bestScore = Math.min(...scores.map(s => s.value));
    } else {
      // For other games, higher is better
      bestScore = Math.max(...scores.map(s => s.value));
    }
    
    return { bestScore, totalScore, averageScore, totalGames };
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

  // Create list of players (current user first, then friends)
  const players = useMemo(() => {
    const allPlayers = [
      ...(user ? [{ 
        id: user.id, 
        name: profile?.full_name || profile?.username || 'You',
        avatar: profile?.avatar_url,
        isCurrentUser: true
      }] : []),
      ...friends
    ];

    // Sort players based on their scores
    return allPlayers.sort((a, b) => {
      const aStats = getFriendStats(a.id);
      const bStats = getFriendStats(b.id);
      
      // If either player has no scores, they go to the bottom
      if (!aStats || !bStats) return 0;
      if (aStats.totalGames === 0 && bStats.totalGames === 0) return 0;
      if (aStats.totalGames === 0) return 1;
      if (bStats.totalGames === 0) return -1;
      
      // For these games, lower scores are better
      if (['wordle', 'mini-crossword', 'connections', 'framed', 'nerdle', 'minute-cryptic'].includes(game.id)) {
        return aStats.averageScore - bStats.averageScore;
      }
      
      // For other games, higher scores are better
      return bStats.averageScore - aStats.averageScore;
    });
  }, [friends, user, profile, game.id, friendScores]);

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
      ) : players.length > 0 ? (
        <div className="space-y-4">
          {players.map((player, index) => {
            const scores = friendScores[player.id] || [];
            const hasScores = scores.length > 0;
            const stats = getFriendStats(player.id);
            
            return (
              <div key={player.id} className="space-y-2">
                <PlayerCard 
                  player={{
                    id: player.id,
                    name: player.isCurrentUser ? `${player.name} (You)` : player.name,
                    avatar: player.avatar
                  }}
                  scores={scores}
                  game={game}
                  stats={stats}
                  rank={index + 1}
                  className={player.isCurrentUser ? "border-2 border-primary/30" : undefined}
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
