
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
    
    const friendsToFetch = [...friends];
    
    // Add current user to friends list if includeCurrentUser is true
    if (includeCurrentUser && user && !friends.some(f => f.id === user.id)) {
      console.log('[useFriendScores] Adding current user to fetch list');
      friendsToFetch.push({
        id: user.id,
        name: 'You'
      });
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
      
      // Process each friend
      const processFriend = async (friend: { id: string; name: string }) => {
        if (!friend.id) {
          console.log(`[useFriendScores] Friend missing ID, skipping`);
          return;
        }
        
        console.log(`[useFriendScores] Fetching scores for friend: ${friend.name || 'Unknown'} (${friend.id})`);
        
        try {
          // Query scores with detailed error logging
          const { data: scoresData, error } = await supabase
            .from('scores')
            .select('*')
            .eq('game_id', gameId)
            .eq('user_id', friend.id);
            
          if (error) {
            console.error(`[useFriendScores] Error fetching scores for friend:`, error);
            newFriendScores[friend.id] = [];
            return;
          }
          
          if (!scoresData || scoresData.length === 0) {
            console.log(`[useFriendScores] No scores found for friend ${friend.name || 'Unknown'}`);
            newFriendScores[friend.id] = [];
            return;
          }
          
          // Map scores to our Score type
          const formattedScores = scoresData.map(score => ({
            id: score.id,
            gameId: score.game_id,
            playerId: score.user_id,
            value: score.value,
            date: score.date,
            notes: score.notes || '',
            createdAt: score.created_at
          }));
          
          console.log(`[useFriendScores] Retrieved ${formattedScores.length} scores for ${friend.name || 'Unknown'}`);
          newFriendScores[friend.id] = formattedScores;
        } catch (error) {
          console.error(`[useFriendScores] Exception processing friend ${friend.name || 'Unknown'}:`, error);
          newFriendScores[friend.id] = [];
        }
      };
      
      // Process all friends in parallel
      await Promise.all(friendsToFetch.map(processFriend));
      
      // Include current user scores if needed and not already fetched
      if (includeCurrentUser && user && currentUserScores.length > 0 && !newFriendScores[user.id]) {
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

  return {
    friendScores,
    fetchFriendScores,
    isLoading
  };
};
