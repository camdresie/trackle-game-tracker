
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
  refreshFriends: () => Promise<void>; // New method to manually refresh friends
}

export const useGameData = ({ gameId }: UseGameDataProps): GameDataResult => {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<Player[]>([]);
  const [friendScores, setFriendScores] = useState<{ [key: string]: Score[] }>({});
  const [bestScore, setBestScore] = useState<number | null>(null);

  // Function to fetch friends data
  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching friends data...');
      // Reset friends first to avoid stale data
      setFriends([]);
      
      // Get user connections (friends)
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');
        
      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        return;
      }
      
      console.log('Connections data:', connections);
      
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
        } else {
          const friendData = friendProfiles.map(profile => ({
            id: profile.id,
            name: profile.full_name || profile.username || 'Unknown User',
            avatar: profile.avatar_url,
            // Include connection ID for each friend for easier removal
            connectionId: connections.find(c => 
              (c.user_id === profile.id && c.friend_id === user.id) || 
              (c.friend_id === profile.id && c.user_id === user.id)
            )?.id
          }));
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
    }
  };

  // Function to refresh friends data (can be called after mutation)
  const refreshFriends = async () => {
    console.log('Refreshing friends data...');
    // Clear friend scores when refreshing friends
    setFriendScores({});
    
    await fetchFriends();
    
    // If we have a gameId, also refresh friend scores
    if (gameId && friends.length > 0) {
      await fetchFriendScores();
    }
  };
  
  // Function to fetch friend scores
  const fetchFriendScores = async () => {
    if (!gameId || !user || friends.length === 0) return;
    
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
          toast.error("Game not found");
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
        toast.error("Failed to load game data");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [gameId, user]);

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
