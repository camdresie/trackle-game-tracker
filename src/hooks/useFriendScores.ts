
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

  // Enhanced fetch function with detailed debugging for RLS issue diagnosis
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
    console.log(`[useFriendScores] Friend IDs:`, friends.map(f => f.id));
    setIsLoading(true);
    
    // Initialize empty scores for all friends
    const newFriendScores: { [key: string]: Score[] } = {};
    friends.forEach(friend => {
      newFriendScores[friend.id] = [];
    });
    
    try {
      // Get current user's session information for debugging
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('[useFriendScores] Current auth session:', 
        sessionData.session ? 'Authenticated as ' + sessionData.session.user.id : 'Not authenticated');
      
      // Process each friend sequentially with detailed logging
      for (const friend of friends) {
        if (!friend.id) {
          console.log(`[useFriendScores] Friend missing ID, skipping:`, friend);
          continue;
        }
        
        console.log(`[useFriendScores] Fetching scores for friend: ${friend.name} (${friend.id}) and game: ${gameId}`);
        
        // First check if the scores table exists and we have access
        const { error: tableAccessError } = await supabase
          .from('scores')
          .select('count(*)', { count: 'exact', head: true });
          
        if (tableAccessError) {
          console.error(`[useFriendScores] Cannot access scores table:`, tableAccessError);
          toast.error("RLS policy issue: Cannot access scores table");
          continue;
        }
        
        // Make a standalone query to first verify if this friend has any scores at all
        // Use simplified query to isolate potential RLS issues
        const { data, error: countError } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('game_id', gameId)
          .eq('user_id', friend.id);
          
        if (countError) {
          console.error(`[useFriendScores] RLS/Count error for ${friend.name}:`, countError);
          console.log(`[useFriendScores] Debug info: Current user: ${sessionData.session?.user.id || 'No user'}, Friend: ${friend.id}, Game: ${gameId}`);
        } else {
          const countValue = data?.length !== undefined ? data.length : 0;
          console.log(`[useFriendScores] Found ${countValue} scores for friend ${friend.name}`);
        }
        
        // Check if we can access any scores at all (not filtered)
        const { data: anyScores, error: anyScoresError } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', friend.id);
          
        if (anyScoresError) {
          console.error(`[useFriendScores] Cannot access ANY scores for ${friend.name}:`, anyScoresError);
        } else {
          const anyScoresCount = anyScores?.length !== undefined ? anyScores.length : 0;
          console.log(`[useFriendScores] Friend ${friend.name} has ${anyScoresCount} total scores in database`);
        }
        
        // Query Supabase directly to get scores with full debug info
        const { data: scoresData, error, status, statusText } = await supabase
          .from('scores')
          .select('*')
          .eq('game_id', gameId)
          .eq('user_id', friend.id)
          .order('date', { ascending: false });
          
        if (error) {
          console.error(`[useFriendScores] Error fetching scores for ${friend.name}:`, error);
          console.log(`[useFriendScores] HTTP Status: ${status} ${statusText}`);
          newFriendScores[friend.id] = [];
          continue;
        }
        
        console.log(`[useFriendScores] Raw scores data for ${friend.name}:`, scoresData);
        console.log(`[useFriendScores] HTTP Status: ${status} ${statusText}`);
        
        // Check permissions - log RLS debug info
        console.log(`[useFriendScores] RLS check: Current user can view scores for user_id=${friend.id}, game_id=${gameId}`);
        
        if (!scoresData || scoresData.length === 0) {
          console.log(`[useFriendScores] No scores found for friend ${friend.name}`);
          newFriendScores[friend.id] = [];
          continue;
        }
        
        // Map retrieved scores to our Score type
        const formattedScores = scoresData.map(score => ({
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
