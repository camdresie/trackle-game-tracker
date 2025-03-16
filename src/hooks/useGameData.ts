
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
  const { friendScores, fetchFriendScores } = useFriendScores({ 
    gameId, 
    friends 
  });
  
  // Enhanced refresh function that updates all data
  const refreshFriends = async () => {
    await baseFriendsRefresh();
    setRefreshCount(prev => prev + 1);
    
    // If we have a gameId, also refresh friend scores
    if (gameId) {
      await fetchFriendScores();
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
    refreshFriends
  };
};
