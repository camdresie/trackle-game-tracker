
import { useGameDetails } from './useGameDetails';
import { useFriendsList } from './useFriendsList';
import { useFriendScores } from './useFriendScores';
import { useState, useEffect } from 'react';

interface UseGameDataProps {
  gameId: string | undefined;
}

/**
 * Composite hook that combines game details, friends list, and friend scores
 * functionality for a comprehensive game data management solution
 */
export const useGameData = ({ gameId }: UseGameDataProps) => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastDebugTimestamp, setLastDebugTimestamp] = useState(0);
  
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
  
  // Periodically log the state for debugging - only in development and not too often
  useEffect(() => {
    const now = Date.now();
    // Only log if more than 3 seconds since last log to avoid console spam
    if (now - lastDebugTimestamp > 3000) {
      console.log(`[useGameData] Debug info for gameId: ${gameId || 'undefined'}`);
      console.log(`[useGameData] Game:`, game);
      console.log(`[useGameData] Friends count: ${friends.length}`);
      console.log(`[useGameData] Friend IDs:`, friends.map(f => f.id));
      console.log(`[useGameData] Friend scores keys:`, Object.keys(friendScores));
      console.log(`[useGameData] Friend scores data for ${friends.length} friends:`, friendScores);
      console.log(`[useGameData] Friend scores loading state:`, friendScoresLoading);
      
      // Check if there's a mismatch between friends and friendScores
      const friendsWithMissingScores = friends.filter(friend => 
        !Object.keys(friendScores).includes(friend.id)
      );
      if (friendsWithMissingScores.length > 0) {
        console.warn(`[useGameData] Some friends have no scores in the state:`, 
          friendsWithMissingScores.map(f => ({ id: f.id, name: f.name }))
        );
      }
      
      setLastDebugTimestamp(now);
    }
  }, [game, friends, friendScores, friendScoresLoading, gameId, lastDebugTimestamp]);
  
  // Enhanced refresh function that updates all data
  const refreshFriends = async () => {
    console.log("[useGameData] Starting friend refresh process...");
    
    try {
      await baseFriendsRefresh();
      setRefreshCount(prev => prev + 1);
      
      // If we have a gameId, also refresh friend scores
      if (gameId) {
        console.log(`[useGameData] Refreshing scores for game ${gameId}`);
        await fetchFriendScores();
      } else {
        console.warn("[useGameData] Cannot refresh friend scores - no gameId available");
      }
      
      console.log("[useGameData] Friend refresh completed successfully");
    } catch (error) {
      console.error("[useGameData] Error during friend refresh:", error);
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
