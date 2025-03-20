
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from 'lucide-react';
import { Score, Game } from '@/utils/types';

interface TodaysGamesProps {
  isLoading: boolean;
  todaysGames: Score[];
  gamesList: Game[];
}

const TodaysGames = ({ isLoading, todaysGames, gamesList }: TodaysGamesProps) => {
  const navigate = useNavigate();

  // Debug logging
  console.log('TodaysGames component rendering with:', { 
    isLoading, 
    todaysGamesCount: todaysGames?.length, 
    todaysGames,
    gamesList 
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
      <div className="glass-card rounded-xl p-4 flex items-center gap-4">
        <div className="p-2 bg-muted rounded-lg">
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-medium">No games played today</h2>
          <p className="text-sm text-muted-foreground">Add your first score to start tracking</p>
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
    <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
      <ScrollArea className="w-full sm:w-auto max-w-full">
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
    </div>
  );
};

export default TodaysGames;
