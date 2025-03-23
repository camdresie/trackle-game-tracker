
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Game, Score } from '@/utils/types';
import { games } from '@/utils/gameData';
import { getGameScores } from '@/services/gameStatsService';
import { getTodaysGames } from '@/services/todayService';
import { useQueryClient } from '@tanstack/react-query';
import { getTodayInEasternTime } from '@/utils/dateUtils'; // Add this import

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
  const [gamesList, setGamesList] = useState<Game[]>(games);
  const [isLoading, setIsLoading] = useState(true);
  const [todaysGames, setTodaysGames] = useState<Score[]>([]);
  
  // Debug logging
  useEffect(() => {
    console.log('[useHomeData] Current user:', user);
    console.log('[useHomeData] Games list:', gamesList);
  }, [user, gamesList]);
  
  // Fetch user's scores and today's games
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        console.log('[useHomeData] Fetching user data for:', user.id);
        
        // Fetch today's games
        const todayScores = await getTodaysGames(user.id);
        console.log('[useHomeData] Fetched today\'s scores:', todayScores);
        setTodaysGames(todayScores);
        
        // Log each game score for debugging
        todayScores.forEach(score => {
          const game = gamesList.find(g => g.id === score.gameId);
          console.log(`[useHomeData] Today's game: ${game?.name || 'Unknown'} (ID: ${score.gameId}), Score: ${score.value}`);
        });
        
        // Fetch all user scores for stats
        const allUserScores: Score[] = [];
        
        for (const game of gamesList) {
          const gameScores = await getGameScores(game.id, user.id);
          allUserScores.push(...gameScores);
        }
        
        console.log('[useHomeData] Fetched all user scores:', allUserScores);
        setScores(allUserScores);
      } catch (error: any) {
        console.error('[useHomeData] Error fetching user data:', error);
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
  
  const handleAddScore = (newScore: Score) => {
    // First, check if this is an update to an existing score
    const isUpdating = scores.some(score => 
      score.gameId === newScore.gameId && score.date === newScore.date
    );
    
    if (isUpdating) {
      // If updating, replace the old score
      setScores(prevScores => prevScores.map(score => 
        score.gameId === newScore.gameId && score.date === newScore.date
          ? newScore
          : score
      ));
      
      // Also update today's games if the score is from today
      setTodaysGames(prevGames => prevGames.map(game => 
        game.gameId === newScore.gameId && game.date === newScore.date
          ? newScore
          : game
      ));
    } else {
      // Add as a new score
      setScores(prevScores => [...prevScores, newScore]);
      
      // Also update today's games if the score is from today
      const today = getTodayInEasternTime();
      if (newScore.date === today) {
        setTodaysGames(prevGames => [...prevGames, newScore]);
      }
    }
    
    // Invalidate relevant query cache to ensure data consistency
    queryClient.invalidateQueries({ queryKey: ['all-scores'] });
    queryClient.invalidateQueries({ queryKey: ['today-games'] });
    queryClient.invalidateQueries({ queryKey: ['game-scores'] });
    
    console.log('[useHomeData] Score operation completed:', newScore);
    console.log('[useHomeData] Updated today\'s games:', 
      isUpdating ? 'Updated existing score' : 'Added new score'
    );
  };

  return {
    isLoading,
    gamesList,
    scores,
    todaysGames,
    selectedGame,
    setSelectedGame,
    showAddScore,
    setShowAddScore,
    showGameSelection,
    setShowGameSelection,
    showConnections,
    setShowConnections,
    handleAddScore
  };
};
