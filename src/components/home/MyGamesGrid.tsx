import { Trophy, X, Search } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { Game, Score } from '@/utils/types';
import { calculateAverageScore, calculateBestScore } from '@/utils/gameData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { isToday } from '@/utils/dateUtils';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

interface MyGamesGridProps {
  isLoading: boolean;
  gamesList: Game[];
  scores: Score[];
}

const MyGamesGrid = ({ isLoading, gamesList, scores }: MyGamesGridProps) => {
  const { profile, updateProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter games to only show ones that are in the selected_games array
  const selectedGames = profile?.selected_games || [];
  const playedGames = gamesList.filter(game => selectedGames.includes(game.id));

  // Check if a game was played today
  const wasPlayedToday = (gameId: string) => {
    return scores.some(score => score.gameId === gameId && isToday(score.date));
  };
  
  // Sort games - Not Played Today (alpha) -> Played Today (alpha)
  const sortedGames = useMemo(() => [...playedGames].sort((a, b) => {
    const aPlayedToday = wasPlayedToday(a.id);
    const bPlayedToday = wasPlayedToday(b.id);

    // Grouping logic: Normal > Played Today
    const getGroup = (playedToday: boolean): number => {
      if (playedToday) return 2; // Played today last
      return 1; // Normal games first
    };

    const groupA = getGroup(aPlayedToday);
    const groupB = getGroup(bPlayedToday);

    if (groupA !== groupB) {
      return groupA - groupB; // Sort by group (1 comes before 2)
    }

    // Within the same group, sort alphabetically by name
    return a.name.localeCompare(b.name);
  }), [playedGames, scores]);

  // Filter games based on search term
  const filteredGames = useMemo(() => {
    if (!searchTerm) {
      return sortedGames;
    }
    return sortedGames.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedGames, searchTerm]);

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
      {/* Search Input */}
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder="Search my games..."
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
        ) : filteredGames.length === 0 && searchTerm === '' ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            You haven't added any games to your collection yet.
            <p className="mt-2">Find all available games in the <strong>All Games</strong> tab and add the ones you play regularly to <strong>My Games</strong>.</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No games found matching "{searchTerm}".
          </div>
        ) : (
          filteredGames.map(game => {
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