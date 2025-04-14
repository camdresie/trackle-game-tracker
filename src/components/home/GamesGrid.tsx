import { GamepadIcon } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { Game, Score } from '@/utils/types';
import { calculateAverageScore, calculateBestScore } from '@/utils/gameData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { isToday } from '@/utils/dateUtils';

interface GamesGridProps {
  isLoading: boolean;
  gamesList: Game[];
  scores: Score[];
}

const GamesGrid = ({ isLoading, gamesList, scores }: GamesGridProps) => {
  const { profile, updateProfile } = useAuth();
  
  // Get the list of selected games
  const selectedGames = profile?.selected_games || [];
  
  // Check if a game has been played
  const hasPlayedGame = (gameId: string) => {
    return scores.some(score => score.gameId === gameId);
  };

  // Check if a game was played today
  const wasPlayedToday = (gameId: string) => {
    return scores.some(score => score.gameId === gameId && isToday(score.date));
  };
  
  // Sort games: New games first, then games not played today, then games played today
  const sortedGames = [...gamesList].sort((a, b) => {
    // Prioritize new games
    if (a.isNew && !b.isNew) return -1; // a (new) comes before b (not new)
    if (!a.isNew && b.isNew) return 1;  // b (new) comes before a (not new)

    // If both are new or both are not new, sort by played today status
    const aPlayedToday = wasPlayedToday(a.id);
    const bPlayedToday = wasPlayedToday(b.id);
    
    if (aPlayedToday && !bPlayedToday) return 1; // a (played today) comes after b (not played today)
    if (!aPlayedToday && bPlayedToday) return -1; // b (played today) comes after a (not played today)

    // If status is the same (both new/not new AND both played/not played today), keep original order
    return 0; 
  });
  
  // Handle adding a game to My Games
  const handleAddGame = async (gameId: string) => {
    if (!profile) return;
    
    // Get current selected games or initialize empty array
    const currentGames = profile.selected_games || [];
    
    // Add the game if it's not already in the array
    if (!currentGames.includes(gameId)) {
      const updatedGames = [...currentGames, gameId];
      
      // Update the profile
      await updateProfile({
        selected_games: updatedGames
      });
      
      // Show success toast
      const game = gamesList.find(g => g.id === gameId);
      toast.success(`${game?.name || 'Game'} added to My Games`);
    }
  };

  return (
    <section className="mb-8 animate-slide-up" style={{animationDelay: '100ms'}}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <GamepadIcon className="w-5 h-5 text-primary" />
          All Games
        </h2>
      </div>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="animate-pulse h-[320px] bg-muted rounded-xl w-full"></div>
          ))
        ) : (
          sortedGames.map(game => {
            const gameScores = scores.filter(score => score.gameId === game.id);
            const latestScore = gameScores.length > 0 
              ? gameScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
              : undefined;
            const averageScore = calculateAverageScore(gameScores);
            const bestScore = calculateBestScore(gameScores, game);
            const isSelected = selectedGames.includes(game.id);
            const hasPlayed = hasPlayedGame(game.id);
            
            return (
              <div key={game.id} className="relative group w-full">
                {!isSelected && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 z-50 text-primary hover:bg-primary/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddGame(game.id);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                <GameCard 
                  game={game}
                  latestScore={latestScore}
                  averageScore={averageScore}
                  bestScore={bestScore}
                />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default GamesGrid;
