import { Link } from 'react-router-dom';
import { Puzzle, Grid, LayoutGrid, Sword, Trophy, Dices, Star, CalendarDays, CheckCircle, Film, Link as LinkIcon, GitMerge, Calculator, Square, Timer, Map, GripVertical } from 'lucide-react';
import { Game, Score } from '@/utils/types';
import { cn } from '@/lib/utils';
import { isToday } from '@/utils/dateUtils';
import { getLabelByGame } from '@/utils/gameData';

interface GameCardProps {
  game: Game;
  latestScore?: Score;
  averageScore?: number | null;
  bestScore?: number | null;
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
      case 'timer':
        return <Timer className="w-5 h-5" />;
      case 'map':
        return <Map className="w-5 h-5" />;
      case 'grip-vertical':
        return <GripVertical className="w-5 h-5" />;
      default:
        return <Dices className="w-5 h-5" />;
    }
  };

  // Format score values based on game type
  const formatScoreValue = (score?: number | null) => {
    if (score === undefined || score === null) return '-';
    
    // Format MM:SS for Mini Crossword
    if (game.id === 'mini-crossword') {
        // Round the score to the nearest whole number (for average scores)
        const roundedScore = Math.round(score); 
        if (roundedScore <= 0) return '0:00';
        const minutes = Math.floor(roundedScore / 60);
        const seconds = roundedScore % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Format scores with decimals (like average) to 2 decimal places
    if (typeof score === 'number' && !Number.isInteger(score)) {
      return score.toFixed(2);
    }
    
    // Default: return score as string
    return score.toString();
  };

  // Check if the game was played today using our utility function
  const isPlayedToday = () => {
    if (!latestScore) return false;
    return isToday(latestScore.date);
  };

  return (
    <Link 
      to={`/game/${game.id}`}
      className="card-hover rounded-xl glass-card p-5 w-full flex flex-col min-h-[320px]"
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
      
      <div className="mb-1 flex items-center gap-2"> 
        <h3 className="text-lg font-semibold">{game.name}</h3>
        {game.isNew && (
          <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
            New
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
      
      <div className="mt-auto grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
          <Trophy className="w-4 h-4 text-amber-500 mb-1" />
          <span className="text-xs text-muted-foreground">Best</span>
          <span className="font-medium">{formatScoreValue(bestScore)}</span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
          <CalendarDays className="w-4 h-4 text-blue-500 mb-1" />
          <span className="text-xs text-muted-foreground">Last</span>
          <span className="font-medium">{formatScoreValue(latestScore?.value)}</span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
          <Star className="w-4 h-4 text-purple-500 mb-1" />
          <span className="text-xs text-muted-foreground">Avg</span>
          <span className="font-medium">{formatScoreValue(averageScore)}</span>
        </div>
      </div>
      
      <div className="mt-2 text-right">
        <span className="text-xs opacity-70">{getLabelByGame(game.id)}</span>
      </div>
    </Link>
  );
};

export default GameCard;
