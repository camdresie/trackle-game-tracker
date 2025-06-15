import React, { memo, useMemo, useState } from 'react';
import { ChevronDown, GamepadIcon, Search } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Game } from '@/utils/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [searchTerm, setSearchTerm] = useState('');

  // Find the current game object
  const currentGame = useMemo(() => games.find(game => game.id === selectedGame) || games[0], [games, selectedGame]);
  
  // Use the useIsMobile hook instead of directly accessing window.innerWidth
  const isMobile = useIsMobile();
  
  // Filter games based on search term
  const filteredGames = useMemo(() => {
    if (!searchTerm) {
      return games;
    }
    return games.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [games, searchTerm]);
  
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
        <DropdownMenuContent className="w-[220px] p-2" align="start">
          <div className="relative mb-2">
            <Input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="pl-8 h-9"
            />
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          <ScrollArea className="h-[200px]">
            {filteredGames.length > 0 ? (
              filteredGames.map(game => (
                <DropdownMenuItem
                  key={game.id}
                  className="flex items-center cursor-pointer"
                  onClick={() => {
                    onSelectGame(game.id);
                    setSearchTerm('');
                  }}
                >
                  <div className={`w-3 h-3 rounded-full ${game.color} mr-2 flex-shrink-0`}></div>
                  <GamepadIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{game.name}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No games found.
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

// Display name for debugging
GameDropdownSelector.displayName = 'GameDropdownSelector';

export default GameDropdownSelector;
