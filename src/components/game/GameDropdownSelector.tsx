
import React from 'react';
import { ChevronDown, GamepadIcon } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Game } from '@/utils/types';

interface GameDropdownSelectorProps {
  selectedGame: string;
  games: Game[];
  onSelectGame: (gameId: string) => void;
  className?: string;
  showOnDesktop?: boolean; // New prop to control desktop visibility
}

const GameDropdownSelector = ({ 
  selectedGame, 
  games, 
  onSelectGame,
  className = '',
  showOnDesktop = false // Default to mobile-only behavior for backward compatibility
}: GameDropdownSelectorProps) => {
  // Find the current game object
  const currentGame = games.find(game => game.id === selectedGame) || games[0];
  
  // If not showing on desktop, check if it's mobile
  if (!showOnDesktop) {
    const isMobile = window.innerWidth < 640; // sm breakpoint in Tailwind
    if (!isMobile) return null;
  }
  
  return (
    <div className={`w-full ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between border border-input"
          >
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${currentGame?.color} mr-2`}></div>
              <GamepadIcon className="w-4 h-4 mr-2" />
              <span>{currentGame?.name || "Select Game"}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[200px]">
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
};

export default GameDropdownSelector;
