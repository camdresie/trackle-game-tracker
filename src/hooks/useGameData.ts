
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Game, Score, Player } from '@/utils/types';
import { getGameById } from '@/utils/gameData';
import { getGameScores } from '@/services/gameStatsService';
import { supabase } from '@/lib/supabase';

interface UseGameDataProps {
  gameId: string | undefined;
}

interface GameDataResult {
  game: Game | null;
  scores: Score[];
  isLoading: boolean;
  bestScore: number | null;
  friends: Player[];
  friendScores: { [key: string]: Score[] };
  refreshFriends: () => Promise<void>;
}

export const useGameData = ({ gameId }: UseGameDataProps): GameDataResult => {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<Player[]>([]);
  const [friendScores, setFriendScores] = useState<{ [key: string]: Score[] }>({});
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // Function to fetch friends data with more robust error handling
  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching friends data...');
      // Always reset friends first to avoid stale data
      setFriends([]);
      setFriendScores({});
      
      // Get user connections (friends) with timestamp to prevent caching
      const timestamp = new Date().getTime();
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('id', { ascending: false });
        
      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        return;
      }
      
      console.log('Connections data:', connections);
      
      if (!connections || connections.length === 0) {
        console.log('No connections found for user:', user.id);
        setFriends([]); // Explicitly set to empty array
        return;
      }
      
      // Get friend IDs from connections
      const friendIds = connections
        .map(conn => conn.user_id === user.id ? conn.friend_id : conn.user_id)
        .filter(Boolean);
        
      if (friendIds.length > 0) {
        // Get friend profiles
        const { data: friendProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds);
          
        if (profilesError) {
          console.error('Error fetching friend profiles:', profilesError);
          setFriends([]); // Reset on error
        } else if (!friendProfiles || friendProfiles.length === 0) {
          console.log('No friend profiles found for IDs:', friendIds);
          setFriends([]); // Reset when no profiles found
        } else {
          const friendData = friendProfiles.map(profile => {
            // Find the corresponding connection for this friend
            const connection = connections.find(c => 
              (c.user_id === profile.id && c.friend_id === user.id) || 
              (c.friend_id === profile.id && c.user_id === user.id)
            );
            
            return {
              id: profile.id,
              name: profile.full_name || profile.username || 'Unknown User',
              avatar: profile.avatar_url,
              // Include connection ID for each friend for easier removal
              connectionId: connection?.id
            };
          });
          
          console.log('Setting friends:', friendData);
          setFriends(friendData);
        }
      } else {
        // No friends, set empty array
        console.log('No friends found, setting empty array');
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]); // Reset on any error
    }
  };

  // Function to refresh friends data (can be called after mutation)
  const refreshFriends = async () => {
    console.log('Refreshing friends data...');
    // Update refresh timestamp to force dependent queries to update
    setLastRefreshTime(Date.now());
    
    // Clear friend scores when refreshing friends
    setFriendScores({});
    setFriends([]); // Ensure we completely reset the friends state
    
    // Wait a moment to allow database changes to propagate
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await fetchFriends();
    
    // If we have a gameId, also refresh friend scores
    if (gameId && friends.length > 0) {
      await fetchFriendScores();
    }
  };
  
  // Function to fetch friend scores
  const fetchFriendScores = async () => {
    if (!gameId || !user || friends.length === 0) return;
    
    // Create a new object to avoid reference issues
    const friendScoresData: { [key: string]: Score[] } = {};
    
    for (const friend of friends) {
      if (!friend.id) continue;
      
      try {
        const scores = await getGameScores(gameId, friend.id);
        // Map scores to ensure all required fields
        friendScoresData[friend.id] = scores.map(score => ({
          id: score.id,
          gameId: score.gameId,
          playerId: score.playerId,
          value: score.value,
          date: score.date,
          notes: score.notes,
          createdAt: new Date().toISOString() // Fixed: No longer trying to access score.created_at
        }));
      } catch (error) {
        console.error(`Error fetching scores for friend ${friend.id}:`, error);
      }
    }
    
    setFriendScores(friendScoresData);
  };

  useEffect(() => {
    async function fetchData() {
      if (!gameId || !user) return;
      
      setIsLoading(true);
      
      try {
        // Get game data
        const gameData = getGameById(gameId);
        if (!gameData) {
          toast({
            title: "Error",
            description: "Game not found",
            variant: "destructive"
          });
          return;
        }
        setGame(gameData);
        
        // Get current player's scores
        const playerScores = await getGameScores(gameId, user.id);
        // Map the scores to ensure they have all required fields
        const mappedScores: Score[] = playerScores.map(score => ({
          id: score.id,
          gameId: score.gameId,
          playerId: score.playerId,
          value: score.value,
          date: score.date,
          notes: score.notes,
          createdAt: new Date().toISOString() // Fixed: No longer trying to access score.created_at
        }));
        setScores(mappedScores);
        
        // Calculate best score
        if (mappedScores.length > 0) {
          if (gameId === 'wordle') {
            setBestScore(Math.min(...mappedScores.map(s => s.value)));
          } else {
            setBestScore(Math.max(...mappedScores.map(s => s.value)));
          }
        }
        
        // Fetch friends data
        await fetchFriends();
        
        // Fetch friend scores if we have friends
        if (friends.length > 0) {
          await fetchFriendScores();
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
        toast({
          title: "Error",
          description: "Failed to load game data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [gameId, user, lastRefreshTime]);

  // Effect to fetch friend scores whenever friends list changes
  useEffect(() => {
    if (friends.length > 0 && gameId) {
      fetchFriendScores();
    }
  }, [friends, gameId]);

  return {
    game,
    scores,
    isLoading,
    bestScore,
    friends,
    friendScores,
    refreshFriends
  };
};
