
import { User, Trophy, Calendar, Award } from 'lucide-react';
import { Player, Score, Game } from '@/utils/types';
import { calculateBestScore, calculateAverageScore } from '@/utils/gameData';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  rank: number;
  scores: Score[];
  game?: Game;
  className?: string;
}

const PlayerCard = ({ player, rank, scores, game, className }: PlayerCardProps) => {
  // Calculate statistics
  const totalGames = scores.length;
  const bestScore = game ? calculateBestScore(scores, game) : 0;
  const averageScore = calculateAverageScore(scores);
  
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
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Games</p>
          <p className="font-semibold">{totalGames}</p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="font-semibold">{bestScore || '-'}</p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Average</p>
          <p className="font-semibold">{averageScore || '-'}</p>
        </div>
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
