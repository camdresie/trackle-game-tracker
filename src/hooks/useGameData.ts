
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
}

export const useGameData = ({ gameId }: UseGameDataProps): GameDataResult => {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<Player[]>([]);
  const [friendScores, setFriendScores] = useState<{ [key: string]: Score[] }>({});
  const [bestScore, setBestScore] = useState<number | null>(null);

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
          createdAt: score.created_at || new Date().toISOString() // Use created_at from DB or current time
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
              avatar: profile.avatar_url
            }));
            setFriends(friendData);
            
            // Fetch scores for each friend
            const friendScoresData: { [key: string]: Score[] } = {};
            
            for (const friendId of friendIds) {
              if (!friendId) continue;
              
              try {
                const scores = await getGameScores(gameId, friendId);
                // Map scores to ensure all required fields
                friendScoresData[friendId] = scores.map(score => ({
                  id: score.id,
                  gameId: score.gameId,
                  playerId: score.playerId,
                  value: score.value,
                  date: score.date,
                  notes: score.notes,
                  createdAt: score.created_at || new Date().toISOString() // Use created_at from DB or current time
                }));
              } catch (error) {
                console.error(`Error fetching scores for friend ${friendId}:`, error);
              }
            }
            
            setFriendScores(friendScoresData);
          }
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
    friendScores
  };
};
