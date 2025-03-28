
import { useGameDetails } from './useGameDetails';
import { useFriendsList } from './useFriendsList';
import { useFriendScores } from './useFriendScores';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface UseGameDataProps {
  gameId: string | undefined;
}

/**
 * Composite hook that combines game details, friends list, and friend scores
 * functionality for a comprehensive game data management solution
 */
export const useGameData = ({ gameId }: UseGameDataProps) => {
  const queryClient = useQueryClient();
  
  // Get basic game details and player scores
  const {
    game,
    scores,
    isLoading,
    bestScore,
    averageScore
  } = useGameDetails({ gameId });
  
  // Get friends list with optimized fetching
  const { friends, refreshFriends: baseFriendsRefresh } = useFriendsList();
  
  // Get scores for all friends and current user using our optimized hook
  const { friendScores, fetchFriendScores, isLoading: friendScoresLoading } = useFriendScores({ 
    gameId, 
    friends,
    includeCurrentUser: true,
    currentUserScores: scores
  });
  
  // Enhanced refresh function that efficiently updates all data
  const refreshFriends = useCallback(async () => {
    try {
      // First check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Invalidate relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      
      // Then refresh the friends list
      await baseFriendsRefresh();
      
      // Then fetch friend scores directly if we have a gameId
      if (gameId) {
        await fetchFriendScores();
        toast.success("Friend data refreshed successfully");
      }
    } catch (error) {
      toast.error("Error refreshing friend data");
    }
  }, [baseFriendsRefresh, fetchFriendScores, gameId, queryClient]);

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
