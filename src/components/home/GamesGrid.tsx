import { GamepadIcon, Search } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { Game, Score } from '@/utils/types';
import { calculateAverageScore, calculateBestScore } from '@/utils/gameData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { isToday } from '@/utils/dateUtils';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

interface GamesGridProps {
  isLoading: boolean;
  gamesList: Game[];
  scores: Score[];
}

const GamesGrid = ({ isLoading, gamesList, scores }: GamesGridProps) => {
  const { profile, updateProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  // Sort games: New (alpha) -> Other (alpha) -> Played Today (alpha)
  const sortedGames = useMemo(() => [...gamesList].sort((a, b) => {
    const aPlayedToday = wasPlayedToday(a.id);
    const bPlayedToday = wasPlayedToday(b.id);

    // Grouping logic: New > Normal > Played Today
    const getGroup = (game: Game, playedToday: boolean): number => {
      if (game.isNew) return 1; // New games first
      if (playedToday) return 3; // Played today last
      return 2; // Normal games in between
    };

    const groupA = getGroup(a, aPlayedToday);
    const groupB = getGroup(b, bPlayedToday);

    if (groupA !== groupB) {
      return groupA - groupB; // Sort by group
    }

    // Within the same group, sort alphabetically by name
    return a.name.localeCompare(b.name);
  }), [gamesList, scores]);

  // Filter games based on search term
  const filteredGames = useMemo(() => {
    if (!searchTerm) {
      return sortedGames;
    }
    return sortedGames.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedGames, searchTerm]);
  
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
      {/* Search Input */}
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder="Search all games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 w-full sm:w-64"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="animate-pulse h-[320px] bg-muted rounded-xl w-full"></div>
          ))
        ) : (
          filteredGames.map(game => {
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
