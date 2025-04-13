import React from 'react';
import { Trophy, CalendarDays, Star } from 'lucide-react';
import { Game, Score } from '@/utils/types';

interface GameStatCardsProps {
  game: Game;
  scores: Score[];
  bestScore: number | null;
}

const GameStatCards = ({ game, scores, bestScore }: GameStatCardsProps) => {
  // Format score values based on game type
  const formatScoreValue = (score?: number | null) => {
    if (score === undefined || score === null) return '-';
    
    // Format MM:SS for Mini Crossword
    if (game.id === 'mini-crossword') {
        if (score <= 0) return '0:00';
        const minutes = Math.floor(score / 60);
        const seconds = score % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Format scores with decimals (like average) to 2 decimal places
    if (typeof score === 'number' && !Number.isInteger(score)) {
      return score.toFixed(2);
    }
    
    // Default: return score as string
    return score.toString();
  };

  // Calculate average score
  const calculateAverage = (scoreList: Score[]) => {
    if (!scoreList.length) return null;
    const sum = scoreList.reduce((total, score) => total + score.value, 0);
    return sum / scoreList.length;
  };

  const averageScore = calculateAverage(scores);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 md:mb-8">
      <div className="glass-card rounded-xl p-3 md:p-5">
        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2 text-muted-foreground text-xs md:text-sm">
          <Trophy className="w-3 h-3 md:w-4 md:h-4" />
          <span>Best</span>
        </div>
        <div className="text-lg sm:text-xl md:text-3xl font-bold">
          {formatScoreValue(bestScore)}
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
          {(game.id === 'mini-crossword' && averageScore !== null) ?
            (() => {
              if (averageScore <= 0) return '0:00';
              const minutes = Math.floor(averageScore / 60);
              const seconds = Math.round(averageScore % 60);
              return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            })()
            : formatScoreValue(averageScore)
          }
        </div>
      </div>
    </div>
  );
};

export default GameStatCards;
