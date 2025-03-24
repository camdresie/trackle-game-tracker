
import React from 'react';
import { Trophy, CalendarDays, Star } from 'lucide-react';
import { Game, Score } from '@/utils/types';

interface GameStatCardsProps {
  game: Game;
  scores: Score[];
  bestScore: number | null;
}

const GameStatCards = ({ game, scores, bestScore }: GameStatCardsProps) => {
  // Format average score to show decimal places only when needed
  const formatAverageScore = (scores: Score[]) => {
    if (!scores.length) return '-';
    
    const sum = scores.reduce((total, score) => total + score.value, 0);
    const avg = sum / scores.length;
    
    // If it's a whole number, return it as is
    if (Number.isInteger(avg)) return avg.toString();
    
    // Otherwise, truncate to 2 decimal places
    return avg.toFixed(2);
  };
  
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 md:mb-8">
      <div className="glass-card rounded-xl p-3 md:p-5">
        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2 text-muted-foreground text-xs md:text-sm">
          <Trophy className="w-3 h-3 md:w-4 md:h-4" />
          <span>Best</span>
        </div>
        <div className="text-lg sm:text-xl md:text-3xl font-bold">
          {bestScore !== null ? bestScore : '-'}
        </div>
      </div>
      
      <div className="glass-card rounded-xl p-3 md:p-5">
        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2 text-muted-foreground text-xs md:text-sm">
          <CalendarDays className="w-3 h-3 md:w-4 md:h-4" />
          <span>Played</span>
        </div>
        <div className="text-lg sm:text-xl md:text-3xl font-bold">
          {scores.length}
        </div>
      </div>
      
      <div className="glass-card rounded-xl p-3 md:p-5">
        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2 text-muted-foreground text-xs md:text-sm">
          <Star className="w-3 h-3 md:w-4 md:h-4" />
          <span>Average</span>
        </div>
        <div className="text-lg sm:text-xl md:text-3xl font-bold">
          {formatAverageScore(scores)}
        </div>
      </div>
    </div>
  );
};

export default GameStatCards;
