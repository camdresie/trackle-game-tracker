import { useCallback, useEffect, useMemo } from 'react';
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
        // Determine the list of user IDs to fetch scores for
        let userIdsToFetch = friends.map(friend => friend.id);
        if (includeCurrentUser && user) {
          // Add current user ID if not already present (e.g., if user is also in friends list)
          if (!userIdsToFetch.includes(user.id)) {
            userIdsToFetch.push(user.id);
          }
        }

        // If no users to fetch for, return empty
        if (userIdsToFetch.length === 0) {
          return {};
        }

        // Make the API call for all required users
        const { data: scoresData } = await supabase
          .from('scores')
          .select('*')
          .eq('game_id', gameId)
          .in('user_id', userIdsToFetch); // Fetch for friends AND current user if included
          
        // Initialize result object
        const newFriendScores: { [key: string]: Score[] } = {};
        
        // Initialize with empty arrays for each required user
        userIdsToFetch.forEach(userId => {
          newFriendScores[userId] = [];
        });
        
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
            // Check if the key exists before trying to push
            if (newFriendScores.hasOwnProperty(userId)) {
              newFriendScores[userId].push(formattedScore);
            } else {
              // This case should technically not happen due to initialization above,
              // but adding for safety.
              newFriendScores[userId] = [formattedScore];
            }
          });
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
    friendScores: friendScores,
    fetchFriendScores,
    isLoading
  };
};
