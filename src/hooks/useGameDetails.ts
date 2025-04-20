import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Game, Score } from '@/utils/types';
import { getGameById, isLowerScoreBetter } from '@/utils/gameData';
import { getGameScores } from '@/services/gameStatsService';
import { useQuery } from '@tanstack/react-query';

interface UseGameDetailsProps {
  gameId: string | undefined;
}

interface GameDetailsResult {
  game: Game | null;
  scores: Score[];
  isLoading: boolean;
  bestScore: number | null;
  averageScore: number | null;
}

/**
 * Hook for fetching basic game details and player scores using React Query
 */
export const useGameDetails = ({ gameId }: UseGameDetailsProps): GameDetailsResult => {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  // Fetch game details (static data, not using useQuery)
  useEffect(() => {
    if (gameId) {
      const gameData = getGameById(gameId);
      setGame(gameData);
      if (!gameData) {
        toast({
          title: "Error",
          description: "Game definition not found",
          variant: "destructive"
        });
      }
    } else {
      setGame(null);
    }
  }, [gameId]);

  // Fetch player scores using React Query
  const { 
    data: scores = [], // Default to empty array 
    isLoading: isLoadingScores, 
    error: scoresError 
  } = useQuery<Score[], Error>({
    queryKey: ['game-scores', gameId, user?.id], // Unique key including game and user
    queryFn: () => {
      if (!gameId || !user) return Promise.resolve([]); // Return empty if no gameId or user
      return getGameScores(gameId, user.id); 
    },
    enabled: !!gameId && !!user, // Only run query if gameId and user exist
    staleTime: 5 * 60 * 1000, // Consider scores stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  // Calculate best and average scores when scores data or game definition changes
  useEffect(() => {
    if (scores.length > 0 && game) {
      try {
        if (isLowerScoreBetter(game.id)) {
          setBestScore(Math.min(...scores.map(s => s.value)));
        } else {
          setBestScore(Math.max(...scores.map(s => s.value)));
        }
        
        const sum = scores.reduce((total, score) => total + score.value, 0);
        setAverageScore(sum / scores.length);
      } catch (calcError) {
        console.error("Error calculating scores:", calcError);
        setBestScore(null);
        setAverageScore(null);
      }
    } else {
      setBestScore(null);
      setAverageScore(null);
    }
  }, [scores, game]); // Recalculate when scores or game data change

  // Handle score fetching errors
  useEffect(() => {
    if (scoresError) {
      console.error("Error fetching game scores:", scoresError);
      toast({
        title: "Error",
        description: "Failed to load your scores for this game.",
        variant: "destructive"
      });
    }
  }, [scoresError]);

  return {
    game,
    scores,
    isLoading: isLoadingScores, // Use loading state from useQuery
    bestScore,
    averageScore
  };
};
