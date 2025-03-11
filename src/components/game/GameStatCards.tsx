
import React from 'react';
import { Trophy, CalendarDays, ListChecks } from 'lucide-react';
import { Game, Score } from '@/utils/types';

interface GameStatCardsProps {
  game: Game;
  scores: Score[];
  bestScore: number | null;
}

const GameStatCards = ({ game, scores, bestScore }: GameStatCardsProps) => {
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
          <ListChecks className="w-4 h-4" />
          <span>Difficulty</span>
        </div>
        <div className="text-3xl font-bold">
          {scores.length > 0 
            ? (game.id === 'wordle' && bestScore === 1) || 
              (!['wordle', 'tightrope', 'quordle'].includes(game.id) && 
              scores.some(s => s.value >= game.maxScore * 0.9))
              ? 'Master'
              : 'Regular'
            : '-'}
        </div>
      </div>
    </div>
  );
};

export default GameStatCards;
