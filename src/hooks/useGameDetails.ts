import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Game, Score } from '@/utils/types';
import { getGameById, isLowerScoreBetter } from '@/utils/gameData';
import { getGameScores } from '@/services/gameStatsService';
import { useQuery } from '@tanstack/react-query';
import { type DateRangeConfig } from './useChartDateRange';

interface UseGameDetailsProps {
  gameId: string | undefined;
  dateRangeConfig?: DateRangeConfig;
}

interface GameDetailsResult {
  game: Game | null;
  scores: Score[]; // Filtered scores for chart
  allScores: Score[]; // All scores for stats
  isLoading: boolean;
  bestScore: number | null;
  averageScore: number | null;
}

/**
 * Hook for fetching basic game details and player scores using React Query
 */
export const useGameDetails = ({ gameId, dateRangeConfig }: UseGameDetailsProps): GameDetailsResult => {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  // Fetch ALL scores for stats calculation (separate from filtered chart data)
  const { 
    data: allScores = []
  } = useQuery<Score[], Error>({
    queryKey: ['all-game-scores', gameId, user?.id], // Separate cache key for all scores
    queryFn: () => {
      if (!gameId || !user) return Promise.resolve([]);
      return getGameScores(gameId, user.id); // No date filtering for stats
    },
    enabled: !!gameId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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

  // Fetch filtered scores for chart display
  const { 
    data: scores = [], // Default to empty array 
    isLoading: isLoadingScores, 
    error: scoresError 
  } = useQuery<Score[], Error>({
    queryKey: ['filtered-game-scores', gameId, user?.id, dateRangeConfig?.startDate, dateRangeConfig?.endDate, dateRangeConfig?.limit], // Include date range in cache key
    queryFn: () => {
      if (!gameId || !user) return Promise.resolve([]); // Return empty if no gameId or user
      return getGameScores(gameId, user.id, {
        startDate: dateRangeConfig?.startDate,
        endDate: dateRangeConfig?.endDate,
        limit: dateRangeConfig?.limit
      }); 
    },
    enabled: !!gameId && !!user, // Only run query if gameId and user exist
    staleTime: 5 * 60 * 1000, // Consider scores stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  // Calculate best and average scores using ALL scores (not filtered)
  useEffect(() => {
    if (allScores.length > 0 && game) {
      try {
        if (isLowerScoreBetter(game.id)) {
          setBestScore(Math.min(...allScores.map(s => s.value)));
        } else {
          setBestScore(Math.max(...allScores.map(s => s.value)));
        }
        
        const sum = allScores.reduce((total, score) => total + score.value, 0);
        setAverageScore(sum / allScores.length);
      } catch (calcError) {
        console.error("Error calculating scores:", calcError);
        setBestScore(null);
        setAverageScore(null);
      }
    } else {
      setBestScore(null);
      setAverageScore(null);
    }
  }, [allScores, game]); // Use allScores for stats calculation

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
    scores, // Filtered scores for chart
    allScores, // All scores for stats/counts
    isLoading: isLoadingScores, // Use loading state from useQuery
    bestScore,
    averageScore
  };
};
