
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Game } from '@/utils/types';
import { Grid3X3, GridIcon, Layout, Puzzle } from 'lucide-react';

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
      case 'tightrope':
        return <Layout className="h-5 w-5" />;
      case 'quordle':
        return <GridIcon className="h-5 w-5" />;
      case 'mini-crossword':
      case 'squardle':
        return <Grid3X3 className="h-5 w-5" />;
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
              className="flex items-center justify-start gap-3 h-14 px-4"
              onClick={() => {
                onSelectGame(game);
                onOpenChange(false);
              }}
            >
              <div className={`${game.color} p-1.5 rounded text-white`}>
                {getGameIcon(game.id)}
              </div>
              <div className="text-left">
                <div className="font-medium">{game.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
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
