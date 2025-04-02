import { Trophy, X } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { Game, Score } from '@/utils/types';
import { calculateAverageScore, calculateBestScore } from '@/utils/gameData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface MyGamesGridProps {
  isLoading: boolean;
  gamesList: Game[];
  scores: Score[];
}

const MyGamesGrid = ({ isLoading, gamesList, scores }: MyGamesGridProps) => {
  const { profile, updateProfile } = useAuth();
  
  // Filter games to only show ones that are in the selected_games array
  const selectedGames = profile?.selected_games || [];
  const playedGames = gamesList.filter(game => selectedGames.includes(game.id));

  // Handle removing a game
  const handleRemoveGame = async (gameId: string) => {
    if (!profile) return;
    
    // Get current selected games or initialize empty array
    const currentGames = profile.selected_games || [];
    
    // Remove the game from the array
    const updatedGames = currentGames.filter(id => id !== gameId);
    
    // Update the profile
    await updateProfile({
      selected_games: updatedGames
    });
    
    // Show success toast
    const game = gamesList.find(g => g.id === gameId);
    toast.success(`${game?.name || 'Game'} removed from My Games`);
  };

  return (
    <section className="mb-8 animate-slide-up" style={{animationDelay: '100ms'}}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          My Games
        </h2>
      </div>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="animate-pulse h-[320px] bg-muted rounded-xl w-full"></div>
          ))
        ) : playedGames.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            You haven't selected any games yet. Add games from the "All Games" section or start playing to automatically add them!
          </div>
        ) : (
          playedGames.map(game => {
            const gameScores = scores.filter(score => score.gameId === game.id);
            const latestScore = gameScores.length > 0 
              ? gameScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
              : undefined;
            const averageScore = calculateAverageScore(gameScores);
            const bestScore = calculateBestScore(gameScores, game);
            
            return (
              <div key={game.id} className="relative group w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 z-50 text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveGame(game.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <GameCard 
                  key={game.id}
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

export default MyGamesGrid; 