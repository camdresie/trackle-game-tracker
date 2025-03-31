import React, { memo, useMemo } from 'react';
import { ChevronDown, GamepadIcon } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Game } from '@/utils/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface GameDropdownSelectorProps {
  selectedGame: string;
  games: Game[];
  onSelectGame: (gameId: string) => void;
  className?: string;
  showOnDesktop?: boolean;
}

// Memoize the component to prevent unnecessary re-renders
const GameDropdownSelector = memo(({ 
  selectedGame, 
  games, 
  onSelectGame,
  className = '',
  showOnDesktop = false
}: GameDropdownSelectorProps) => {
  // Find the current game object
  const currentGame = useMemo(() => games.find(game => game.id === selectedGame) || games[0], [games, selectedGame]);
  
  // Use the useIsMobile hook instead of directly accessing window.innerWidth
  const isMobile = useIsMobile();
  
  // If not showing on desktop and not on mobile, return null
  if (!showOnDesktop && !isMobile) {
    return null;
  }
  
  return (
    <div className={`w-full sm:w-auto ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full sm:w-[220px] justify-between border border-input"
          >
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${currentGame?.color} mr-2`}></div>
              <GamepadIcon className="w-4 h-4 mr-2" />
              <span>{currentGame?.name || "Select Game"}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[220px]" align="start">
          {games.map(game => (
            <DropdownMenuItem
              key={game.id}
              className="flex items-center cursor-pointer"
              onClick={() => onSelectGame(game.id)}
            >
              <div className={`w-3 h-3 rounded-full ${game.color} mr-2`}></div>
              <GamepadIcon className="w-4 h-4 mr-2" />
              <span>{game.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

// Display name for debugging
GameDropdownSelector.displayName = 'GameDropdownSelector';

export default GameDropdownSelector;
