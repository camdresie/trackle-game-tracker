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
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
          <Trophy className="w-4 h-4" />
          <span>Best Score</span>
        </div>
        <div className="text-3xl font-bold">
          {bestScore !== null ? bestScore : '-'}
        </div>
      </div>
      
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span>Played</span>
        </div>
        <div className="text-3xl font-bold">
          {scores.length}
        </div>
      </div>
      
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
          <Star className="w-4 h-4" />
          <span>Average Score</span>
        </div>
        <div className="text-3xl font-bold">
          {formatAverageScore(scores)}
        </div>
      </div>
    </div>
  );
};

export default GameStatCards;
