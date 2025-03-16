
import { useState, useCallback } from 'react';
import { Score } from '@/utils/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface UseFriendScoresProps {
  gameId: string | undefined;
  friends: { id: string; name: string }[];
}

interface FriendScoresResult {
  friendScores: { [key: string]: Score[] };
  fetchFriendScores: () => Promise<void>;
  isLoading: boolean;
}

export const useFriendScores = ({ gameId, friends }: UseFriendScoresProps): FriendScoresResult => {
  const [friendScores, setFriendScores] = useState<{ [key: string]: Score[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Simplified fetch function with clear logging
  const fetchFriendScores = useCallback(async () => {
    if (!gameId) {
      console.log('[useFriendScores] Missing gameId, cannot fetch scores');
      return;
    }
    
    if (friends.length === 0) {
      console.log('[useFriendScores] No friends to fetch scores for');
      return;
    }
    
    console.log(`[useFriendScores] Fetching scores for ${friends.length} friends for game:`, gameId);
    setIsLoading(true);
    
    // Initialize empty scores for all friends
    const newFriendScores: { [key: string]: Score[] } = {};
    
    try {
      // Process each friend sequentially for clarity
      for (const friend of friends) {
        if (!friend.id) {
          console.log(`[useFriendScores] Friend missing ID, skipping:`, friend);
          continue;
        }
        
        console.log(`[useFriendScores] Fetching scores for friend: ${friend.name} (${friend.id})`);
        
        // Direct query to Supabase
        const { data, error } = await supabase
          .from('scores')
          .select('*')
          .eq('game_id', gameId)
          .eq('user_id', friend.id)
          .order('date', { ascending: false });
          
        if (error) {
          console.error(`[useFriendScores] Error fetching scores for ${friend.name}:`, error);
          newFriendScores[friend.id] = [];
          continue;
        }
        
        if (!data || data.length === 0) {
          console.log(`[useFriendScores] No scores found for friend ${friend.name}`);
          newFriendScores[friend.id] = [];
          continue;
        }
        
        // Map retrieved scores to our Score type
        const formattedScores = data.map(score => ({
          id: score.id,
          gameId: score.game_id,
          playerId: score.user_id,
          value: score.value,
          date: score.date,
          notes: score.notes || '',
          createdAt: score.created_at
        }));
        
        console.log(`[useFriendScores] Retrieved ${formattedScores.length} scores for ${friend.name}:`, formattedScores);
        newFriendScores[friend.id] = formattedScores;
      }
      
      // Set all friend scores at once
      setFriendScores(newFriendScores);
      console.log('[useFriendScores] All friend scores fetched:', newFriendScores);
      
    } catch (error) {
      console.error('[useFriendScores] Global error in fetchFriendScores:', error);
      toast.error("Failed to load friend scores");
    } finally {
      setIsLoading(false);
    }
  }, [gameId, friends]);

  return {
    friendScores,
    fetchFriendScores,
    isLoading
  };
};
