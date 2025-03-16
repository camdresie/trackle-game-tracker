
import { useGameDetails } from './useGameDetails';
import { useFriendsList } from './useFriendsList';
import { useFriendScores } from './useFriendScores';
import { useState } from 'react';

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
  
  console.log(`useGameData - Friend scores data for ${friends.length} friends:`, friendScores);
  console.log(`useGameData - Friend scores loading state:`, friendScoresLoading);
  
  // Enhanced refresh function that updates all data
  const refreshFriends = async () => {
    console.log("Starting friend refresh process...");
    
    try {
      await baseFriendsRefresh();
      setRefreshCount(prev => prev + 1);
      
      // If we have a gameId, also refresh friend scores
      if (gameId) {
        console.log(`Refreshing scores for game ${gameId}`);
        await fetchFriendScores();
      }
      
      console.log("Friend refresh completed successfully");
    } catch (error) {
      console.error("Error during friend refresh:", error);
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
