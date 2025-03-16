
import { useState, useEffect } from 'react';
import { Score } from '@/utils/types';
import { getGameScores } from '@/services/gameStatsService';
import { toast } from '@/components/ui/use-toast';

interface UseFriendScoresProps {
  gameId: string | undefined;
  friends: { id: string; name: string }[];
}

interface FriendScoresResult {
  friendScores: { [key: string]: Score[] };
  fetchFriendScores: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook for fetching and managing friend scores for a specific game
 */
export const useFriendScores = ({ gameId, friends }: UseFriendScoresProps): FriendScoresResult => {
  const [friendScores, setFriendScores] = useState<{ [key: string]: Score[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to fetch friend scores with enhanced error handling and debugging
  const fetchFriendScores = async () => {
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
      console.log(`[useFriendScores] Processing ${friendsWithIds.length} friends with IDs`);
      
      if (friendsWithIds.length === 0) {
        console.warn('[useFriendScores] All friends are missing IDs, nothing to fetch');
        setIsLoading(false);
        return;
      }
      
      await Promise.all(friendsWithIds.map(async (friend) => {
        console.log(`[useFriendScores] Fetching scores for friend ${friend.name} (${friend.id})`);
        
        try {
          const scores = await getGameScores(gameId, friend.id);
          
          // Initialize the scores array for this friend, even if empty
          if (scores && scores.length > 0) {
            console.log(`[useFriendScores] Retrieved ${scores.length} scores for friend ${friend.name}:`, scores);
            friendScoresData[friend.id] = scores;
          } else {
            console.log(`[useFriendScores] No scores found for friend ${friend.name}`);
            friendScoresData[friend.id] = [];
          }
        } catch (error) {
          console.error(`[useFriendScores] Error fetching scores for friend ${friend.name}:`, error);
          friendScoresData[friend.id] = [];
          
          toast({
            title: `Error loading scores`,
            description: `Couldn't load scores for ${friend.name}`,
            variant: "destructive"
          });
        }
      }));
      
      console.log('[useFriendScores] All friend scores fetched:', friendScoresData);
      
      // Check if any scores were actually found
      const totalScores = Object.values(friendScoresData).reduce(
        (sum, scores) => sum + scores.length, 0
      );
      console.log(`[useFriendScores] Total scores found across all friends: ${totalScores}`);
      
      // Set the state with all friend scores
      setFriendScores(friendScoresData);
    } catch (error) {
      console.error('[useFriendScores] Global error in fetchFriendScores:', error);
      toast({
        title: "Error",
        description: "Failed to load friend scores",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch friend scores whenever friends list or gameId changes
  useEffect(() => {
    if (gameId && friends.length > 0) {
      console.log('[useFriendScores] Effect triggered - fetching scores');
      fetchFriendScores();
    } else {
      console.log('[useFriendScores] Effect triggered but missing data:', { 
        hasGameId: !!gameId, 
        friendsCount: friends.length 
      });
    }
  }, [gameId, friends]);

  return {
    friendScores,
    fetchFriendScores,
    isLoading
  };
};
