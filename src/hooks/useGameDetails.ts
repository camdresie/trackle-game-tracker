
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Game, Score } from '@/utils/types';
import { getGameById } from '@/utils/gameData';
import { getGameScores } from '@/services/gameStatsService';

interface UseGameDetailsProps {
  gameId: string | undefined;
}

interface GameDetailsResult {
  game: Game | null;
  scores: Score[];
  isLoading: boolean;
  bestScore: number | null;
}

/**
 * Hook for fetching basic game details and player scores
 */
export const useGameDetails = ({ gameId }: UseGameDetailsProps): GameDetailsResult => {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    async function fetchGameData() {
      if (!gameId || !user) {
        console.log('Missing gameId or user, skipping game data fetch');
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
    
    fetchGameData();
  }, [gameId, user]);

  return {
    game,
    scores,
    isLoading,
    bestScore
  };
};
