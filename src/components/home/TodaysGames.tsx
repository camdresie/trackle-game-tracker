
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, InfoIcon } from 'lucide-react';
import { Score, Game } from '@/utils/types';
import { useEffect, useState } from 'react';

interface TodaysGamesProps {
  isLoading: boolean;
  todaysGames: Score[];
  gamesList: Game[];
}

const TodaysGames = ({ isLoading, todaysGames, gamesList }: TodaysGamesProps) => {
  const navigate = useNavigate();
  const [displayMode, setDisplayMode] = useState<'single-row' | 'multi-row'>('single-row');

  // Determine if we should use multi-row layout based on games count
  useEffect(() => {
    if (todaysGames?.length > 6) {
      setDisplayMode('multi-row');
    } else {
      setDisplayMode('single-row');
    }
  }, [todaysGames]);

  // Debug logging
  console.log('TodaysGames component rendering with:', { 
    isLoading, 
    todaysGamesCount: todaysGames?.length, 
    todaysGames,
    gamesList,
    displayMode 
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-4 flex items-center gap-4">
        <div className="animate-pulse h-4 bg-muted rounded w-full"></div>
      </div>
    );
  }

  if (!todaysGames || todaysGames.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-muted rounded-lg">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-medium">No games played today</h2>
            <p className="text-sm text-muted-foreground">Add your first score to start tracking</p>
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-2.5 flex items-center gap-2 text-xs">
          <InfoIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <p className="text-muted-foreground">
            Today's scores reset at midnight Eastern Time (ET).
          </p>
        </div>
      </div>
    );
  }

  // More detailed logging to debug specific games
  todaysGames.forEach(score => {
    const game = gamesList.find(g => g.id === score.gameId);
    console.log(`Today's game: ${game?.name || 'Unknown'} (ID: ${score.gameId}), Score: ${score.value}`);
  });

  return (
    <div className="glass-card rounded-xl p-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="p-2 bg-accent/20 rounded-lg">
          <Calendar className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-medium">Today's Games</h2>
          <p className="text-sm text-muted-foreground">
            You've played {todaysGames.length} game{todaysGames.length !== 1 ? 's' : ''} today
          </p>
        </div>
        <div className="flex-1"></div>
      </div>
      
      {displayMode === 'single-row' ? (
        <ScrollArea className="w-full max-w-full">
          <div className="flex gap-2 pb-1">
            {todaysGames.map(score => {
              const game = gamesList.find(g => g.id === score.gameId);
              if (!game) {
                console.log(`Could not find game for score:`, score);
                return null;
              }
              
              return (
                <div 
                  key={score.id}
                  className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full min-w-max cursor-pointer hover:bg-secondary/80"
                  onClick={() => navigate(`/game/${game.id}`)}
                >
                  <div className={`w-2 h-2 rounded-full ${game.color}`}></div>
                  <span className="text-sm font-medium">{game.name}</span>
                  <span className="text-sm">{score.value}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-wrap gap-2">
          {todaysGames.map(score => {
            const game = gamesList.find(g => g.id === score.gameId);
            if (!game) {
              console.log(`Could not find game for score:`, score);
              return null;
            }
            
            return (
              <div 
                key={score.id}
                className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full cursor-pointer hover:bg-secondary/80"
                onClick={() => navigate(`/game/${game.id}`)}
              >
                <div className={`w-2 h-2 rounded-full ${game.color}`}></div>
                <span className="text-sm font-medium">{game.name}</span>
                <span className="text-sm">{score.value}</span>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="bg-muted/30 rounded-lg p-2.5 flex items-center gap-2 text-xs">
        <InfoIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <p className="text-muted-foreground">
          Today's scores reset at midnight Eastern Time (ET).
        </p>
      </div>
    </div>
  );
};

export default TodaysGames;
