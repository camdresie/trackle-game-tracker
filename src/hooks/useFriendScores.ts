import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Score } from '@/utils/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UseFriendScoresProps {
  gameId: string | undefined;
  friends: { id: string; name: string }[];
  includeCurrentUser?: boolean;
  currentUserScores?: Score[];
}

interface FriendScoresResult {
  friendScores: { [key: string]: Score[] };
  fetchFriendScores: () => Promise<void>;
  isLoading: boolean;
}

export const useFriendScores = ({ 
  gameId, 
  friends, 
  includeCurrentUser = false,
  currentUserScores = []
}: UseFriendScoresProps): FriendScoresResult => {
  const { user } = useAuth();
  
  // Use TanStack Query for better caching and fetch management
  const { data: friendScores = {}, isLoading, refetch } = useQuery({
    queryKey: ['friend-scores', gameId, includeCurrentUser],
    queryFn: async () => {
      if (!gameId) {
        return {};
      }
      
      try {
        // Determine which friends to fetch scores for
        const friendsToFetch = friends.filter(friend => includeCurrentUser || true);
        
        if (friendsToFetch.length === 0 && !includeCurrentUser) {
          return {};
        }
        
        // Format friends array for API call - we need an array of friend IDs
        const friendIds = friendsToFetch.map(friend => friend.id);
        
        // Make the API call 
        const { data: scoresData } = await supabase
          .from('scores')
          .select('*')
          .eq('game_id', gameId)
          .in('user_id', friendIds);
          
        // Initialize result object
        const newFriendScores: { [key: string]: Score[] } = {};
        
        // Initialize with empty arrays for each friend
        friendIds.forEach(friendId => {
          newFriendScores[friendId] = [];
        });
        
        // Include current user ID if needed
        if (includeCurrentUser && user) {
          newFriendScores[user.id] = [];
        }
        
        // Process all scores
        if (scoresData) {
          scoresData.forEach(score => {
            const userId = score.user_id;
            
            // Format the score to our Score type
            const formattedScore = {
              id: score.id,
              gameId: score.game_id,
              playerId: score.user_id,
              value: score.value,
              date: score.date,
              notes: score.notes || '',
              createdAt: score.created_at
            };
            
            // Add to the appropriate user's scores array
            if (newFriendScores[userId]) {
              newFriendScores[userId] = [...(newFriendScores[userId] || []), formattedScore];
            } else {
              console.warn(`Found scores for user ${userId} but they are not in the friends list.`);
            }
          });
        }
        
        // Include current user scores if provided
        if (includeCurrentUser && user && currentUserScores.length > 0) {
          newFriendScores[user.id] = currentUserScores;
        }
        
        return newFriendScores;
      } catch (error) {
        console.error('Exception in useFriendScores:', error);
        toast.error("Failed to load friend scores");
        return {};
      }
    },
    enabled: !!gameId && (friends.length > 0 || includeCurrentUser),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    // Add placeholder data for better UX
    placeholderData: (oldData) => {
      if (!oldData) return {};
      
      // If we have current user scores, include them in placeholder data
      if (includeCurrentUser && user && currentUserScores.length > 0) {
        return {
          ...oldData,
          [user.id]: currentUserScores
        };
      }
      
      return oldData;
    }
  });

  // Effect to refetch only when necessary
  useEffect(() => {
    // Only refetch if:
    // 1. We have a gameId
    // 2. We have friends or includeCurrentUser is true
    // 3. We don't have any data yet
    if (gameId && (friends.length > 0 || includeCurrentUser) && Object.keys(friendScores).length === 0) {
      refetch();
    }
  }, [friends, gameId, refetch, includeCurrentUser, friendScores]);

  // Function to manually trigger refetch
  const fetchFriendScores = useCallback(async () => {
    if (gameId) {
      await refetch();
    }
  }, [gameId, refetch]);

  return {
    friendScores,
    fetchFriendScores,
    isLoading
  };
};
