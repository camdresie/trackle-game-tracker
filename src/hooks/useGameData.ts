import { useGameDetails } from './useGameDetails';
import { useFriendsList } from './useFriendsList';
import { useFriendScores } from './useFriendScores';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { type DateRangeConfig } from './useChartDateRange';

interface UseGameDataProps {
  gameId: string | undefined;
  dateRangeConfig?: DateRangeConfig;
}

/**
 * Composite hook that combines game details, friends list, and friend scores
 * functionality for a comprehensive game data management solution
 */
export const useGameData = ({ gameId, dateRangeConfig }: UseGameDataProps) => {
  const queryClient = useQueryClient();
  
  // Get basic game details and player scores
  const {
    game,
    scores,
    allScores,
    isLoading,
    bestScore,
    averageScore
  } = useGameDetails({ gameId, dateRangeConfig });
  
  // Get friends list with optimized fetching
  const { friends, refreshFriends: baseFriendsRefresh } = useFriendsList();
  
  // Get scores for all friends and current user using our optimized hook
  const { friendScores, fetchFriendScores, isLoading: friendScoresLoading } = useFriendScores({ 
    gameId, 
    friends,
    includeCurrentUser: true,
    currentUserScores: scores
  });
  
  // Set up real-time subscription for score updates
  useEffect(() => {
    if (!gameId) return;

    // Subscribe to score changes for this game
    const subscription = supabase
      .channel(`scores-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          // Invalidate both filtered and all scores queries
          const currentUserId = queryClient.getQueryData<any>(['user'])?.id;
          if (gameId && currentUserId) {
             queryClient.invalidateQueries({ queryKey: ['filtered-game-scores', gameId, currentUserId] });
             queryClient.invalidateQueries({ queryKey: ['all-game-scores', gameId, currentUserId] });
          }
          // Invalidate other relevant general queries
          queryClient.invalidateQueries({ queryKey: ['friend-scores'] });
          queryClient.invalidateQueries({ queryKey: ['game-stats'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId, queryClient]);
  
  // Effect to refresh friend scores when friends list changes
  useEffect(() => {
    if (gameId && friends.length > 0) {
      fetchFriendScores();
    }
  }, [friends, fetchFriendScores, gameId]);
  
  // Enhanced refresh function that efficiently updates all data
  const refreshFriends = useCallback(async () => {
    try {
      // First check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Invalidate relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-scores'] });
      queryClient.invalidateQueries({ queryKey: ['filtered-game-scores'] });
      queryClient.invalidateQueries({ queryKey: ['all-game-scores'] });
      
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
    scores, // Filtered scores for chart
    allScores, // All scores for stats/counts
    isLoading,
    bestScore,
    averageScore,
    friends,
    friendScores,
    friendScoresLoading,
    refreshFriends
  };
};
