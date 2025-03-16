
import { useGameDetails } from './useGameDetails';
import { useFriendsList } from './useFriendsList';
import { useFriendScores } from './useFriendScores';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseGameDataProps {
  gameId: string | undefined;
}

/**
 * Composite hook that combines game details, friends list, and friend scores
 * functionality for a comprehensive game data management solution
 */
export const useGameData = ({ gameId }: UseGameDataProps) => {
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Get basic game details and player scores
  const {
    game,
    scores,
    isLoading,
    bestScore,
    averageScore
  } = useGameDetails({ gameId });
  
  // Get friends list with refresh capability
  const { friends, refreshFriends: baseFriendsRefresh } = useFriendsList({ 
    refreshTrigger: refreshCount 
  });
  
  // Get scores for all friends
  const { friendScores, fetchFriendScores, isLoading: friendScoresLoading } = useFriendScores({ 
    gameId, 
    friends 
  });
  
  // Enhanced debug function
  const logDebugInfo = useCallback(() => {
    console.log(`[useGameData] Debug info for gameId: ${gameId || 'undefined'}`);
    console.log(`[useGameData] Game:`, game);
    console.log(`[useGameData] Friends count: ${friends.length}`);
    console.log(`[useGameData] Friend IDs:`, friends.map(f => f.id));
    console.log(`[useGameData] Friend scores keys:`, Object.keys(friendScores));
    console.log(`[useGameData] Friend scores data summary:`, 
      Object.entries(friendScores).map(([id, scores]) => ({
        friendId: id,
        scoreCount: scores.length,
        scoreValues: scores.map(s => s.value)
      }))
    );
    console.log(`[useGameData] Friend scores loading state:`, friendScoresLoading);
  }, [game, friends, friendScores, friendScoresLoading, gameId]);
  
  // Periodically log the state for debugging
  useEffect(() => {
    logDebugInfo();
  }, [logDebugInfo, friends, friendScores]);
  
  // Enhanced refresh function that updates all data
  const refreshFriends = async () => {
    console.log("[useGameData] Starting friend refresh process...");
    
    try {
      // First refresh the friends list
      await baseFriendsRefresh();
      setRefreshCount(prev => prev + 1);
      
      // If we have a gameId, also refresh friend scores
      if (gameId) {
        console.log(`[useGameData] Refreshing scores for game ${gameId}`);
        await fetchFriendScores();
        toast.success("Friend data refreshed successfully");
        
        // Log debug information after refresh
        logDebugInfo();
      } else {
        console.warn("[useGameData] Cannot refresh friend scores - no gameId available");
        toast.error("Cannot refresh scores - game ID not available");
      }
      
      console.log("[useGameData] Friend refresh completed successfully");
    } catch (error) {
      console.error("[useGameData] Error during friend refresh:", error);
      toast.error("Error refreshing friend data");
    }
  };

  return {
    game,
    scores,
    isLoading,
    bestScore,
    averageScore,
    friends,
    friendScores,
    friendScoresLoading,
    refreshFriends
  };
};
