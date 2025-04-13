import { User, Trophy, Calendar, Award } from 'lucide-react';
import { Player, Score, Game } from '@/utils/types';
import { calculateBestScore, calculateAverageScore } from '@/utils/gameData';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  rank: number;
  scores: Score[];
  game?: Game;
  stats?: {
    bestScore: number;
    totalScore: number;
    averageScore: number;
    totalGames: number;
  };
  className?: string;
  showTodayOnly?: boolean; // New prop to show today's score only
}

const PlayerCard = ({ 
  player, 
  rank, 
  scores, 
  game, 
  stats, 
  className,
  showTodayOnly = false // Default to showing all stats
}: PlayerCardProps) => {
  // Calculate statistics or use provided stats
  const totalGames = stats?.totalGames ?? (scores.length || null);
  const bestScore = stats?.bestScore ?? (game ? calculateBestScore(scores, game) : null);
  const averageScore = stats?.averageScore ?? calculateAverageScore(scores);
  
  // Get latest play date
  const latestDate = scores.length > 0 
    ? new Date(scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date)
    : null;
  
  // Medal colors for top 3 ranks
  const rankColors: Record<number, string> = {
    1: 'text-amber-500',
    2: 'text-slate-400',
    3: 'text-amber-700'
  };

  // Format score display
  const formatScore = (score: number | null) => {
    if (score === null || score === undefined) return '-';
    
    // Specific formatting for time-based games (MM:SS) - ONLY Mini Crossword
    if (game && game.id === 'mini-crossword') {
      if (score <= 0) return '0:00'; // Handle zero scores
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Handle Wordle zero scores
    if (game?.id === 'wordle' && score === 0) {
      return '-';
    }
    
    // Format average score to two decimal places (only if it's not an integer)
    if (typeof score === 'number' && !Number.isInteger(score)) {
      // Check if it's the average score being formatted (more robust check needed if formatScore is reused)
      // For now, assume non-integer scores are averages that need formatting.
      return score.toFixed(2);
    }
    
    // Default: return score as is
    return score.toString();
  };
  
  return (
    <div className={cn(
      "rounded-xl glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in relative",
      className
    )}>
      {/* Rank badge */}
      <div className="flex items-center justify-center">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
          rankColors[rank] ? `${rankColors[rank]} border-2 border-current` : "bg-secondary"
        )}>
          {rank <= 3 ? (
            <Trophy className={cn("w-5 h-5", rankColors[rank])} />
          ) : (
            rank
          )}
        </div>
      </div>
      
      {/* Player info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-medium">{player.name}</h3>
            {latestDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Last played: {latestDate.toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats section - always visible, styled differently for mobile/desktop */}
      <div className="w-full sm:w-auto flex justify-between sm:justify-end items-center gap-3 sm:gap-6 pt-3 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-t-0 border-muted/30">
        {showTodayOnly ? (
          // Show limited stats in today view
          <>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Games</p>
              <p className="font-semibold">{totalGames ?? '-'}</p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="font-semibold">{formatScore(bestScore)}</p>
            </div>
          </>
        ) : (
          // Show all stats in "All Time" mode
          <>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Games</p>
              <p className="font-semibold">{totalGames ?? '-'}</p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Best</p>
              <p className="font-semibold">{formatScore(bestScore)}</p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg</p>
              <p className="font-semibold">{formatScore(averageScore)}</p>
            </div>
          </>
        )}
      </div>
      
      {/* Winner badge */}
      {rank === 1 && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-pulse-subtle">
          <Award className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
