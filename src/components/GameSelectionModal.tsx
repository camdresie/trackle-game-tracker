import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Game, Score } from '@/utils/types';
import { Grid3X3, GridIcon, Layout, Puzzle, Film, Link as LinkIcon, GitMerge, Calculator, Square, Timer, Trophy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { isToday } from '@/utils/dateUtils';
import { calculateAverageScore, calculateBestScore } from '@/utils/gameData';

interface GameSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  games: Game[];
  onSelectGame: (game: Game) => void;
  scores?: Score[];
}

const GameSelectionModal = ({ 
  open, 
  onOpenChange, 
  games,
  onSelectGame,
  scores = [] 
}: GameSelectionModalProps) => {
  const { profile } = useAuth();
  
  // Get the list of selected games (My Games)
  const selectedGameIds = profile?.selected_games || [];
  
  // Filter games for "My Games" section
  const myGames = games.filter(game => selectedGameIds.includes(game.id));
  
  // Check if a game was played today
  const wasPlayedToday = (gameId: string) => {
    return scores.some(score => score.gameId === gameId && isToday(score.date));
  };
  
  // Sort games - games played today go to the end of the list
  const sortedMyGames = [...myGames].sort((a, b) => {
    const aPlayedToday = wasPlayedToday(a.id);
    const bPlayedToday = wasPlayedToday(b.id);
    
    if (aPlayedToday && !bPlayedToday) return 1;
    if (!aPlayedToday && bPlayedToday) return -1;
    return 0;
  });

  // Sort all games - games played today go to the end of the list
  const sortedAllGames = [...games].sort((a, b) => {
    const aPlayedToday = wasPlayedToday(a.id);
    const bPlayedToday = wasPlayedToday(b.id);
    
    if (aPlayedToday && !bPlayedToday) return 1;
    if (!aPlayedToday && bPlayedToday) return -1;
    return 0;
  });

  // Function to get the appropriate icon for each game
  const getGameIcon = (gameId: string) => {
    switch (gameId) {
      case 'wordle':
        return <Puzzle className="h-5 w-5" />;
      case 'framed':
        return <Film className="h-5 w-5" />;
      case 'connections':
        return <LinkIcon className="h-5 w-5" />;
      case 'betweenle':
        return <GitMerge className="h-5 w-5" />;
      case 'nerdle':
        return <Calculator className="h-5 w-5" />;
      case 'spelling-bee':
        // Custom bee SVG icon since Lucide doesn't have a bee icon
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12 1l4 4-4 4-4-4 4-4z" />
            <path d="M18 5l4 4-4 4-4-4 4-4z" />
            <path d="M6 5l4 4-4 4-4-4 4-4z" />
            <path d="M12 9l4 4-4 4-4-4 4-4z" />
            <path d="M12 17l4 4-4 4-4-4 4-4z" />
          </svg>
        );
      case 'tightrope':
        return <Layout className="h-5 w-5" />;
      case 'quordle':
        return <GridIcon className="h-5 w-5" />;
      case 'mini-crossword':
        return <Grid3X3 className="h-5 w-5" />;
      case 'squardle':
        return <Square className="h-5 w-5" />;
      case 'minute-cryptic':
        return <Timer className="h-5 w-5" />;
      default:
        return <Puzzle className="h-5 w-5" />;
    }
  };

  // Render a game button
  const renderGameButton = (game: Game) => {
    const playedToday = wasPlayedToday(game.id);
    
    return (
      <Button
        key={game.id}
        variant="outline"
        className="flex items-center justify-start gap-3 h-auto min-h-[56px] px-4 py-3 w-full"
        onClick={() => {
          onSelectGame(game);
          onOpenChange(false);
        }}
      >
        <div className={`${game.color} p-1.5 rounded text-white flex-shrink-0`}>
          {getGameIcon(game.id)}
        </div>
        <div className="text-left overflow-hidden flex-1">
          <div className="font-medium">{game.name}</div>
          <div className="text-xs text-muted-foreground break-words whitespace-normal">
            {game.description}
          </div>
        </div>
        {playedToday && (
          <div className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
            Played today
          </div>
        )}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select a Game</DialogTitle>
          <DialogDescription>
            Choose which game you want to add a score for
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden py-4">
          <ScrollArea className="h-[50vh]">
            <div className="grid grid-cols-1 gap-3 pr-4">
              {/* My Games section */}
              {sortedMyGames.length > 0 && (
                <>
                  <div className="flex items-center gap-2 font-semibold text-lg mb-1">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>My Games</span>
                  </div>
                  
                  {sortedMyGames.map(game => renderGameButton(game))}
                  
                  <Separator className="my-3" />
                </>
              )}
              
              {/* All Games section */}
              <div className="font-semibold text-lg mb-1">All Games</div>
              {sortedAllGames.map(game => renderGameButton(game))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameSelectionModal;
