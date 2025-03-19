
import { useState, useCallback, useEffect } from 'react';
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
  const [friendScores, setFriendScores] = useState<{ [key: string]: Score[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Add current user's scores to friendScores when they change
  useEffect(() => {
    if (includeCurrentUser && user && currentUserScores.length > 0) {
      setFriendScores(prev => ({
        ...prev,
        [user.id]: currentUserScores
      }));
    }
  }, [includeCurrentUser, user, currentUserScores]);

  // Enhanced fetch function with better error handling
  const fetchFriendScores = useCallback(async () => {
    if (!gameId) {
      console.log('[useFriendScores] Missing gameId, cannot fetch scores');
      return;
    }
    
    // Get a list of all unique friend IDs
    const friendsToFetch = [...new Set([...friends.map(f => f.id)])];
    
    // Add current user to friends list if includeCurrentUser is true
    if (includeCurrentUser && user && !friendsToFetch.includes(user.id)) {
      console.log('[useFriendScores] Adding current user to fetch list');
      friendsToFetch.push(user.id);
    }
    
    if (friendsToFetch.length === 0) {
      console.log('[useFriendScores] No friends or current user to fetch scores for');
      return;
    }
    
    console.log(`[useFriendScores] Fetching scores for ${friendsToFetch.length} friends/users for game:`, gameId);
    
    setIsLoading(true);
    
    try {
      // Initialize empty scores for all friends
      const newFriendScores: { [key: string]: Score[] } = {};
      
      // Get today's date for filtering today's scores
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all scores in a single query
      const { data: scoresData, error } = await supabase
        .from('scores')
        .select('*')
        .eq('game_id', gameId)
        .in('user_id', friendsToFetch);
        
      if (error) {
        console.error(`[useFriendScores] Error fetching scores:`, error);
        toast.error("Failed to load friend scores");
        setIsLoading(false);
        return;
      }
      
      console.log(`[useFriendScores] Retrieved ${scoresData?.length || 0} total scores`);
      
      // Group scores by user_id
      if (scoresData) {
        // Initialize empty arrays for all friends
        friendsToFetch.forEach(friendId => {
          newFriendScores[friendId] = [];
        });
        
        // Process all scores
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
          
          // Log today's scores for debugging
          if (score.date === today) {
            console.log(`[useFriendScores] Found today's score for user ${userId}: ${score.value}`);
          }
        });
      }
      
      // Include current user scores if provided
      if (includeCurrentUser && user && currentUserScores.length > 0) {
        newFriendScores[user.id] = currentUserScores;
      }
      
      setFriendScores(newFriendScores);
      console.log('[useFriendScores] Final scores data:', newFriendScores);
      
    } catch (error) {
      console.error('[useFriendScores] Global error in fetchFriendScores:', error);
      toast.error("Failed to load friend scores");
    } finally {
      setIsLoading(false);
    }
  }, [gameId, friends, includeCurrentUser, user, currentUserScores]);

  // Fetch scores when gameId or friends change
  useEffect(() => {
    if (gameId && (friends.length > 0 || includeCurrentUser)) {
      fetchFriendScores();
    }
  }, [gameId, friends, includeCurrentUser, fetchFriendScores]);

  return {
    friendScores,
    fetchFriendScores,
    isLoading
  };
};
