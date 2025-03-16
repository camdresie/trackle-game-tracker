
import { useState, useEffect, useCallback } from 'react';
import { Score } from '@/utils/types';
import { getGameScores } from '@/services/gameStatsService';
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
  const [lastFetchAttempt, setLastFetchAttempt] = useState<number>(0);

  // Function to fetch friend scores with enhanced error handling and debugging
  const fetchFriendScores = useCallback(async () => {
    if (!gameId) {
      console.error('[useFriendScores] Missing gameId, cannot fetch scores');
      return;
    }
    
    if (friends.length === 0) {
      console.log('[useFriendScores] No friends to fetch scores for');
      return;
    }
    
    console.log(`[useFriendScores] Fetching scores for ${friends.length} friends for game:`, gameId);
    setIsLoading(true);
    
    // Create a new object to hold all friend scores
    const friendScoresData: { [key: string]: Score[] } = {};
    
    try {
      // Process each friend in parallel
      const friendsWithIds = friends.filter(friend => !!friend.id);
      console.log(`[useFriendScores] Processing ${friendsWithIds.length} friends with IDs:`, 
        friendsWithIds.map(f => ({ id: f.id, name: f.name })));
      
      if (friendsWithIds.length === 0) {
        console.warn('[useFriendScores] All friends are missing IDs, nothing to fetch');
        setIsLoading(false);
        return;
      }
      
      // Initialize scores arrays for all friends
      friendsWithIds.forEach(friend => {
        friendScoresData[friend.id] = [];
      });
      
      const promises = friendsWithIds.map(async (friend) => {
        console.log(`[useFriendScores] Fetching scores for friend ${friend.name} (${friend.id})`);
        
        try {
          // Direct query to ensure we're getting the latest data
          const { data, error } = await supabase
            .from('scores')
            .select('*')
            .eq('game_id', gameId)
            .eq('user_id', friend.id)
            .order('date', { ascending: false });
            
          if (error) {
            console.error(`[useFriendScores] Database error for friend ${friend.name}:`, error);
            return;
          }
          
          if (data && data.length > 0) {
            console.log(`[useFriendScores] Retrieved ${data.length} raw scores for friend ${friend.name}:`, data);
            
            // Transform the data to match our Score type
            const formattedScores = data.map(score => ({
              id: score.id,
              gameId: score.game_id,
              playerId: score.user_id,
              value: score.value,
              date: score.date,
              notes: score.notes || '',
              createdAt: score.created_at
            }));
            
            friendScoresData[friend.id] = formattedScores;
            console.log(`[useFriendScores] Transformed scores for ${friend.name}:`, formattedScores);
          } else {
            console.log(`[useFriendScores] No scores found for friend ${friend.name}`);
            friendScoresData[friend.id] = [];
          }
        } catch (error) {
          console.error(`[useFriendScores] Error fetching scores for friend ${friend.name}:`, error);
          friendScoresData[friend.id] = [];
        }
      });
      
      await Promise.all(promises);
      
      console.log('[useFriendScores] All friend scores fetched:', friendScoresData);
      
      // Set the state with all friend scores
      setFriendScores(friendScoresData);
    } catch (error) {
      console.error('[useFriendScores] Global error in fetchFriendScores:', error);
      toast.error("Failed to load friend scores");
    } finally {
      setIsLoading(false);
      setLastFetchAttempt(Date.now());
    }
  }, [gameId, friends]);

  // Effect to fetch friend scores whenever friends list or gameId changes
  useEffect(() => {
    const fetchData = async () => {
      if (gameId && friends.length > 0) {
        console.log('[useFriendScores] Effect triggered - fetching scores');
        await fetchFriendScores();
      } else {
        console.log('[useFriendScores] Effect triggered but missing data:', { 
          hasGameId: !!gameId, 
          friendsCount: friends.length 
        });
      }
    };
    
    fetchData();
  }, [gameId, friends, fetchFriendScores]);

  return {
    friendScores,
    fetchFriendScores,
    isLoading
  };
};
