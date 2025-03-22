
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
  const totalGames = stats?.totalGames || scores.length;
  const bestScore = stats?.bestScore || (game ? calculateBestScore(scores, game) : 0);
  const averageScore = stats?.averageScore || calculateAverageScore(scores);
  
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

  // Format score display for Wordle (display "-" for 0 scores)
  const formatScore = (score: number) => {
    if (game?.id === 'wordle' && score === 0) {
      return '-';
    }
    
    // Format average score to two decimal places
    if (typeof score === 'number' && !Number.isInteger(score)) {
      return score.toFixed(2);
    }
    
    return score;
  };
  
  return (
    <div className={cn(
      "rounded-xl glass-card p-4 flex items-center gap-4 animate-fade-in",
      className
    )}>
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
      
      <div className="hidden sm:flex items-center gap-6">
        {showTodayOnly ? (
          // Even in today view, show total games played all time
          <>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Games Total</p>
              <p className="font-semibold">{totalGames}</p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Today's Score</p>
              <p className="font-semibold">{formatScore(bestScore)}</p>
            </div>
          </>
        ) : (
          // Show all stats in "All Time" mode
          <>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Games</p>
              <p className="font-semibold">{totalGames}</p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Best</p>
              <p className="font-semibold">{formatScore(bestScore)}</p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="font-semibold">{formatScore(averageScore)}</p>
            </div>
          </>
        )}
      </div>
      
      {rank === 1 && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-pulse-subtle">
          <Award className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
