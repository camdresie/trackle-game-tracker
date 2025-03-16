
import { useState, useEffect } from 'react';
import { Score } from '@/utils/types';
import { getGameScores } from '@/services/gameStatsService';

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

  // Function to fetch friend scores with error handling
  const fetchFriendScores = async () => {
    if (!gameId || friends.length === 0) {
      console.log('Missing required data for fetching friend scores');
      return;
    }
    
    console.log(`Fetching scores for ${friends.length} friends for game:`, gameId);
    setIsLoading(true);
    
    // Create a new object to avoid reference issues
    const friendScoresData: { [key: string]: Score[] } = {};
    
    try {
      await Promise.all(friends.map(async (friend) => {
        if (!friend.id) {
          console.warn('Found friend entry with missing ID, skipping');
          return;
        }
        
        try {
          console.log(`Fetching scores for friend ${friend.name} (${friend.id})`);
          const scores = await getGameScores(gameId, friend.id);
          console.log(`Retrieved ${scores.length} scores for friend ${friend.name}`);
          
          if (scores && scores.length > 0) {
            // Map scores to ensure all required fields
            friendScoresData[friend.id] = scores.map(score => ({
              id: score.id,
              gameId: score.gameId,
              playerId: score.playerId,
              value: score.value,
              date: score.date,
              notes: score.notes || '',
              createdAt: score.createdAt || new Date().toISOString()
            }));
          } else {
            // Initialize with empty array even if no scores found
            friendScoresData[friend.id] = [];
          }
        } catch (error) {
          console.error(`Error fetching scores for friend ${friend.id}:`, error);
          // Initialize with empty array on error
          friendScoresData[friend.id] = [];
        }
      }));
      
      console.log('Setting friend scores:', friendScoresData);
      setFriendScores(friendScoresData);
    } catch (error) {
      console.error('Error in fetchFriendScores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch friend scores whenever friends list or gameId changes
  useEffect(() => {
    if (friends.length > 0 && gameId) {
      console.log('Friends list or gameId changed, fetching updated friend scores');
      fetchFriendScores();
    }
  }, [friends, gameId]);

  return {
    friendScores,
    fetchFriendScores,
    isLoading
  };
};
