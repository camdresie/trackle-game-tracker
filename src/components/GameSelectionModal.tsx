
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Game } from '@/utils/types';
import { Grid3X3, GridIcon, Layout, Puzzle, Film, Link as LinkIcon, GitMerge, Calculator, Square } from 'lucide-react';

interface GameSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  games: Game[];
  onSelectGame: (game: Game) => void;
}

const GameSelectionModal = ({ 
  open, 
  onOpenChange, 
  games,
  onSelectGame 
}: GameSelectionModalProps) => {
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
      default:
        return <Puzzle className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle>Select a Game</DialogTitle>
          <DialogDescription>
            Choose which game you want to add a score for
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 grid grid-cols-1 gap-3">
          {games.map((game) => (
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
              <div className="text-left overflow-hidden">
                <div className="font-medium">{game.name}</div>
                <div className="text-xs text-muted-foreground break-words whitespace-normal">
                  {game.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameSelectionModal;
