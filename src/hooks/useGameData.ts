
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
  
  // Log Supabase connection status for debugging RLS issues
  useEffect(() => {
    // Check if we're authenticated
    supabase.auth.getSession().then(({ data }) => {
      const sessionStatus = data.session ? 'Authenticated' : 'Not authenticated';
      const userId = data.session?.user?.id || 'No user ID';
      console.log(`[useGameData] Auth status: ${sessionStatus}, User ID: ${userId}`);
    });
  }, []);
  
  // Enhanced refresh function that efficiently updates all data
  const refreshFriends = useCallback(async () => {
    console.log("[useGameData] Starting friend refresh process...");
    
    try {
      // First check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('[useGameData] Refresh with auth status:', 
        sessionData.session ? 'Authenticated as ' + sessionData.session.user.id : 'Not authenticated');
      
      // Invalidate relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      
      // Then refresh the friends list
      await baseFriendsRefresh();
      
      // Then fetch friend scores directly if we have a gameId
      if (gameId) {
        console.log("[useGameData] Refreshing friend scores for game:", gameId);
        await fetchFriendScores();
        toast.success("Friend data refreshed successfully");
      } else {
        console.log("[useGameData] Cannot refresh scores - game ID not available");
      }
      
      console.log("[useGameData] Friend refresh completed successfully");
    } catch (error) {
      console.error("[useGameData] Error during friend refresh:", error);
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
