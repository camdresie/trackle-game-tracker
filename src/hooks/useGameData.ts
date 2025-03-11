
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

  // Enhanced function to fetch friends data with more robust error handling
  const fetchFriends = async () => {
    if (!user) {
      console.log('No user available, skipping friends fetch');
      return;
    }
    
    try {
      console.log('Fetching friends data for user:', user.id);
      
      // Always reset friends first to avoid stale data
      setFriends([]);
      setFriendScores({});
      
      // Get user connections (friends) with timestamp to prevent caching
      const timestamp = new Date().getTime();
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('*, friend:profiles!connections_friend_id_fkey(*), user:profiles!connections_user_id_fkey(*)')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .order('id', { ascending: false });
        
      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        toast({
          title: "Error",
          description: "Failed to load friends data",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Connections data (count):', connections?.length || 0);
      console.log('Raw connections data:', JSON.stringify(connections, null, 2));
      
      if (!connections || connections.length === 0) {
        console.log('No connections found for user:', user.id);
        setFriends([]); // Explicitly set to empty array
        return;
      }
      
      // Format the connections data into friends array
      const friendsData = connections.map(conn => {
        // Determine if the current user is the initiator
        const isUserInitiator = conn.user_id === user.id;
        
        // Get the correct profile based on the relationship direction
        const friendProfile = isUserInitiator ? conn.friend : conn.user;
        
        if (!friendProfile) {
          console.error('Missing profile data in connection:', conn);
          return null;
        }
        
        console.log(`Connection ${conn.id}: Friend profile:`, friendProfile);
        
        return {
          id: isUserInitiator ? conn.friend_id : conn.user_id,
          name: friendProfile.username || friendProfile.full_name || 'Unknown User',
          avatar: friendProfile.avatar_url,
          connectionId: conn.id
        };
      }).filter(Boolean) as Player[];
      
      console.log('Formatted friends data:', friendsData);
      setFriends(friendsData);
    } catch (error) {
      console.error('Error in fetchFriends function:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading friends",
        variant: "destructive"
      });
      setFriends([]); // Reset on any error
    }
  };

  // Enhanced function to refresh friends data with better error handling
  const refreshFriends = async () => {
    console.log('Refreshing friends data...');
    
    try {
      // Update refresh timestamp to force dependent queries to update
      setLastRefreshTime(Date.now());
      
      // Clear friend-related state
      setFriendScores({});
      setFriends([]); 
      
      // Wait a moment to allow database changes to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch fresh friends data
      await fetchFriends();
      
      console.log('Friends data refreshed successfully');
      
      // If we have a gameId, also refresh friend scores
      if (gameId && friends.length > 0) {
        console.log('Refreshing friend scores for game:', gameId);
        await fetchFriendScores();
      }
      
      // Show success toast
      toast({
        title: "Success",
        description: "Friend data refreshed successfully"
      });
    } catch (error) {
      console.error('Error refreshing friends data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh friends data",
        variant: "destructive"
      });
    }
  };
  
  // Function to fetch friend scores with error handling
  const fetchFriendScores = async () => {
    if (!gameId || !user || friends.length === 0) {
      console.log('Missing required data for fetching friend scores');
      return;
    }
    
    console.log(`Fetching scores for ${friends.length} friends for game:`, gameId);
    
    // Create a new object to avoid reference issues
    const friendScoresData: { [key: string]: Score[] } = {};
    
    for (const friend of friends) {
      if (!friend.id) {
        console.warn('Found friend entry with missing ID, skipping');
        continue;
      }
      
      try {
        console.log(`Fetching scores for friend ${friend.name} (${friend.id})`);
        const scores = await getGameScores(gameId, friend.id);
        
        // Map scores to ensure all required fields
        friendScoresData[friend.id] = scores.map(score => ({
          id: score.id,
          gameId: score.gameId,
          playerId: score.playerId,
          value: score.value,
          date: score.date,
          notes: score.notes,
          createdAt: new Date().toISOString()
        }));
        
        console.log(`Retrieved ${scores.length} scores for friend ${friend.name}`);
      } catch (error) {
        console.error(`Error fetching scores for friend ${friend.id}:`, error);
      }
    }
    
    console.log('Setting friend scores:', friendScoresData);
    setFriendScores(friendScoresData);
  };

  // Main effect to fetch game data, scores, and friends
  useEffect(() => {
    async function fetchData() {
      if (!gameId || !user) {
        console.log('Missing gameId or user, skipping data fetch');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get game data
        const gameData = getGameById(gameId);
        if (!gameData) {
          console.error('Game not found with ID:', gameId);
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
          createdAt: new Date().toISOString()
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
      console.log('Friends list changed, fetching updated friend scores');
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
