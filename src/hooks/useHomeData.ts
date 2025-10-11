import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Game, Score } from '@/utils/types';
import { games } from '@/utils/gameData';
import { getTodaysGames } from '@/services/todayService';
import { useQueryClient } from '@tanstack/react-query';
import { getTodayInEasternTime } from '@/utils/dateUtils';
import { supabase } from '@/lib/supabase';

export interface HomeDataResult {
  isLoading: boolean;
  gamesList: Game[];
  scores: Score[];
  todaysGames: Score[];
  selectedGame: Game | null;
  setSelectedGame: (game: Game | null) => void;
  showAddScore: boolean;
  setShowAddScore: (show: boolean) => void;
  showGameSelection: boolean;
  setShowGameSelection: (show: boolean) => void;
  showConnections: boolean;
  setShowConnections: (show: boolean) => void;
  handleAddScore: (newScore: Score) => void;
  handleDeleteScore: (scoreId: string) => void;
}

export const useHomeData = (): HomeDataResult => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showAddScore, setShowAddScore] = useState(false);
  const [showGameSelection, setShowGameSelection] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [scores, setScores] = useState<Score[]>([]);
  const gamesList = useMemo(() => games, []);
  const [isLoading, setIsLoading] = useState(true);
  const [todaysGames, setTodaysGames] = useState<Score[]>([]);
  
  // Fetch user's scores and today's games
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch today's games
        const todayScores = await getTodaysGames(user.id);
        setTodaysGames(todayScores);
        
        // Fetch all user scores for stats
        const { data: allScoresData, error: scoresError } = await supabase
          .from('scores')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (scoresError) {
          throw scoresError;
        }
        
        const allUserScores: Score[] = (allScoresData || []).map(score => ({
          id: score.id,
          gameId: score.game_id,
          playerId: score.user_id,
          value: score.value,
          date: score.date,
          notes: score.notes || '',
          createdAt: score.created_at
        }));
        
        setScores(allUserScores);
      } catch (error: any) {
        toast({
          title: 'Error fetching your data',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, gamesList, toast]);
  
  const handleAddScore = useCallback((newScore: Score) => {
    // First, check if this is an update to an existing score
    setScores(prevScores => {
      const isUpdating = prevScores.some(score => 
        score.gameId === newScore.gameId && score.date === newScore.date
      );
      
      if (isUpdating) {
        // If updating, replace the old score
        return prevScores.map(score => 
          score.gameId === newScore.gameId && score.date === newScore.date
            ? newScore
            : score
        );
      } else {
        // Add as a new score
        return [...prevScores, newScore];
      }
    });
    
    // Also update today's games if the score is from today
    const today = getTodayInEasternTime();
    setTodaysGames(prevGames => {
      const isUpdating = prevGames.some(game => 
        game.gameId === newScore.gameId && game.date === newScore.date
      );
      
      if (isUpdating) {
        return prevGames.map(game => 
          game.gameId === newScore.gameId && game.date === newScore.date
            ? newScore
            : game
        );
      } else if (newScore.date === today) {
        return [...prevGames, newScore];
      }
      
      return prevGames;
    });
    
    // Invalidate relevant query cache to ensure data consistency
    queryClient.invalidateQueries({ queryKey: ['all-scores'] });
    queryClient.invalidateQueries({ queryKey: ['today-games'] });
    queryClient.invalidateQueries({ queryKey: ['game-scores'] });
  }, [queryClient]);
  
  const handleDeleteScore = useCallback((scoreId: string) => {
    // Remove the score from the scores array
    setScores(prevScores => prevScores.filter(score => score.id !== scoreId));
    
    // Remove from today's games if present
    setTodaysGames(prevGames => prevGames.filter(game => game.id !== scoreId));
    
    // Invalidate relevant query cache to ensure data consistency
    queryClient.invalidateQueries({ queryKey: ['all-scores'] });
    queryClient.invalidateQueries({ queryKey: ['today-games'] });
    queryClient.invalidateQueries({ queryKey: ['game-scores'] });
  }, [queryClient]);
  
  // Memoize the setSelectedGame function to prevent unnecessary re-renders
  const memoizedSetSelectedGame = useCallback((game: Game | null) => {
    setSelectedGame(game);
  }, []);
  
  // Memoize other state setters
  const memoizedSetShowAddScore = useCallback((show: boolean) => {
    setShowAddScore(show);
  }, []);
  
  const memoizedSetShowGameSelection = useCallback((show: boolean) => {
    setShowGameSelection(show);
  }, []);
  
  const memoizedSetShowConnections = useCallback((show: boolean) => {
    setShowConnections(show);
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    isLoading,
    gamesList,
    scores,
    todaysGames,
    selectedGame,
    setSelectedGame: memoizedSetSelectedGame,
    showAddScore,
    setShowAddScore: memoizedSetShowAddScore,
    showGameSelection,
    setShowGameSelection: memoizedSetShowGameSelection,
    showConnections,
    setShowConnections: memoizedSetShowConnections,
    handleAddScore,
    handleDeleteScore
  }), [
    isLoading,
    gamesList,
    scores,
    todaysGames,
    selectedGame,
    memoizedSetSelectedGame,
    showAddScore,
    memoizedSetShowAddScore,
    showGameSelection,
    memoizedSetShowGameSelection,
    showConnections,
    memoizedSetShowConnections,
    handleAddScore,
    handleDeleteScore
  ]);
};
