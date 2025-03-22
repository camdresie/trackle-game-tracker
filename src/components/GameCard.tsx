import { Link } from 'react-router-dom';
import { Puzzle, Grid, LayoutGrid, Sword, Trophy, Dices, Star, CalendarDays, CheckCircle, Film, Link as LinkIcon, GitMerge, Calculator, Square } from 'lucide-react';
import { Game, Score } from '@/utils/types';
import { cn } from '@/lib/utils';
import { isToday } from '@/utils/dateUtils';
import { getLabelByGame } from '@/utils/gameData';

interface GameCardProps {
  game: Game;
  latestScore?: Score;
  averageScore?: number;
  bestScore?: number;
}

const GameCard = ({ game, latestScore, averageScore, bestScore }: GameCardProps) => {
  const getIcon = () => {
    switch (game.icon) {
      case 'puzzle':
        return <Puzzle className="w-5 h-5" />;
      case 'grid':
        return <Grid className="w-5 h-5" />;
      case 'layout-grid':
        return <LayoutGrid className="w-5 h-5" />;
      case 'sword':
        return <Sword className="w-5 h-5" />;
      case 'film':
        return <Film className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      case 'merge':
        return <GitMerge className="w-5 h-5" />;
      case 'calculator':
        return <Calculator className="w-5 h-5" />;
      case 'bee':
        // Custom bee SVG icon
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
            className="w-5 h-5"
          >
            <path d="M12 1l4 4-4 4-4-4 4-4z" />
            <path d="M18 5l4 4-4 4-4-4 4-4z" />
            <path d="M6 5l4 4-4 4-4-4 4-4z" />
            <path d="M12 9l4 4-4 4-4-4 4-4z" />
            <path d="M12 17l4 4-4 4-4-4 4-4z" />
          </svg>
        );
      case 'square':
        return <Square className="w-5 h-5" />;
      default:
        return <Dices className="w-5 h-5" />;
    }
  };

  // Format the average score to show only up to 2 decimal places when needed
  const formatAverageScore = (score?: number) => {
    if (score === undefined) return '-';
    
    // If it's a whole number, return it as is
    if (Number.isInteger(score)) return score.toString();
    
    // Otherwise, truncate to 2 decimal places
    return score.toFixed(2);
  };

  // Check if the game was played today using our utility function
  const isPlayedToday = () => {
    if (!latestScore) return false;
    return isToday(latestScore.date);
  };
  
  return (
    <Link 
      to={`/game/${game.id}`}
      className="card-hover rounded-xl glass-card p-5 w-full max-w-xs flex flex-col"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-lg", game.color)}>
          {getIcon()}
        </div>
        <div className="flex items-center gap-2">
          {isPlayedToday() && (
            <div className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Played today</span>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mb-1">{game.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
      
      <div className="mt-auto grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
          <Trophy className="w-4 h-4 text-amber-500 mb-1" />
          <span className="text-xs text-muted-foreground">Best</span>
          <span className="font-medium">{bestScore || '-'}</span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
          <CalendarDays className="w-4 h-4 text-blue-500 mb-1" />
          <span className="text-xs text-muted-foreground">Last</span>
          <span className="font-medium">{latestScore?.value || '-'}</span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
          <Star className="w-4 h-4 text-purple-500 mb-1" />
          <span className="text-xs text-muted-foreground">Avg</span>
          <span className="font-medium">{formatAverageScore(averageScore)}</span>
        </div>
      </div>
      
      <div className="mt-2 text-right">
        <span className="text-xs opacity-70">{getLabelByGame(game.id)}</span>
      </div>
    </Link>
  );
};

export default GameCard;
