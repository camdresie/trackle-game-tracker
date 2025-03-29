
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
  
  // Create a stable array of friend IDs for query key
  const friendIds = friends.map(f => f.id).sort().join(',');
  
  // Use TanStack Query for better caching and fetch management
  const { data: friendScores = {}, isLoading, refetch } = useQuery({
    queryKey: ['friend-scores', gameId, friendIds, includeCurrentUser],
    queryFn: async () => {
      if (!gameId) {
        return {};
      }
      
      // Get a list of all unique friend IDs
      const friendsToFetch = [...new Set([...friends.map(f => f.id)])];
      
      // Add current user to friends list if includeCurrentUser is true
      if (includeCurrentUser && user && !friendsToFetch.includes(user.id)) {
        friendsToFetch.push(user.id);
      }
      
      if (friendsToFetch.length === 0) {
        return {};
      }
      
      try {
        // Initialize empty scores for all friends
        const newFriendScores: { [key: string]: Score[] } = {};
        
        // Initialize empty arrays for all friends
        friendsToFetch.forEach(friendId => {
          newFriendScores[friendId] = [];
        });
        
        // Fetch all scores in a single query
        const { data: scoresData, error } = await supabase
          .from('scores')
          .select('*')
          .eq('game_id', gameId)
          .in('user_id', friendsToFetch);
          
        if (error) {
          toast.error("Failed to load friend scores");
          return newFriendScores;
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
            newFriendScores[userId] = [...(newFriendScores[userId] || []), formattedScore];
          });
        }
        
        // Include current user scores if provided
        if (includeCurrentUser && user && currentUserScores.length > 0) {
          newFriendScores[user.id] = currentUserScores;
        }
        
        return newFriendScores;
      } catch (error) {
        toast.error("Failed to load friend scores");
        return {};
      }
    },
    enabled: !!gameId && (friends.length > 0 || includeCurrentUser),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Effect to refetch when friends list changes
  useEffect(() => {
    // If the friends list changes, automatically refetch data
    if (gameId && friends.length > 0) {
      refetch();
    }
  }, [friends, gameId, refetch]);

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
