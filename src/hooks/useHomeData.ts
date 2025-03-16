
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Game, Score } from '@/utils/types';
import { games } from '@/utils/gameData';
import { getGameScores, getTodaysGames } from '@/services/gameStatsService';

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
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showAddScore, setShowAddScore] = useState(false);
  const [showGameSelection, setShowGameSelection] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [scores, setScores] = useState<Score[]>([]);
  const [gamesList, setGamesList] = useState<Game[]>(games);
  const [isLoading, setIsLoading] = useState(true);
  const [todaysGames, setTodaysGames] = useState<Score[]>([]);
  
  // Fetch user's scores and today's games
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch today's games using the service
        const todayScores = await getTodaysGames(user.id);
        // Map scores to ensure all required fields
        const mappedTodayScores: Score[] = todayScores.map(score => ({
          id: score.id,
          gameId: score.gameId,
          playerId: score.playerId,
          value: score.value,
          date: score.date,
          notes: score.notes,
          createdAt: new Date().toISOString() // Always set a default createdAt
        }));
        console.log('Fetched today\'s scores:', mappedTodayScores);
        setTodaysGames(mappedTodayScores);
        
        // Fetch all user scores for stats
        const allUserScores: Score[] = [];
        
        for (const game of gamesList) {
          const gameScores = await getGameScores(game.id, user.id);
          // Map scores to ensure all required fields
          const mappedScores: Score[] = gameScores.map(score => ({
            id: score.id,
            gameId: score.gameId,
            playerId: score.playerId,
            value: score.value,
            date: score.date,
            notes: score.notes,
            createdAt: new Date().toISOString() // Always set a default createdAt
          }));
          allUserScores.push(...mappedScores);
        }
        
        setScores(allUserScores);
      } catch (error: any) {
        console.error('Error fetching user data:', error);
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
    setScores((prevScores) => [...prevScores, newScore]);
    // Also update today's games if the score is from today
    const today = new Date().toISOString().split('T')[0];
    if (newScore.date === today) {
      setTodaysGames((prevGames) => [...prevGames, newScore]);
    }
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
