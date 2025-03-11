
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Game, Score } from '@/utils/types';

interface ScoreListProps {
  scores: Score[];
  game: Game;
  onAddScore: () => void;
  user: any;
}

const ScoreList = ({ scores, game, onAddScore, user }: ScoreListProps) => {
  const formatDate = (dateString: string) => {
    // Create date object from date string without timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in JS
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-2">Your Score History</h2>
      
      {scores.length > 0 ? (
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          <div className="space-y-4">
            {[...scores]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((score) => (
                <div 
                  key={score.id}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary rounded-md p-2 w-12 h-12 flex items-center justify-center">
                      <span className="text-xl font-bold">{score.value}</span>
                    </div>
                    <div>
                      <div className="font-medium">{formatDate(score.date)}</div>
                      {score.notes && (
                        <div className="text-sm text-muted-foreground">{score.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className={
                    (game.id === 'wordle' && score.value <= 3) || 
                    (!['wordle', 'tightrope', 'quordle'].includes(game.id) && score.value >= game.maxScore * 0.8)
                      ? 'text-emerald-500' 
                      : 'text-amber-500'
                  }>
                    {(game.id === 'wordle' && score.value <= 2)
                      ? 'Excellent'
                      : (game.id === 'wordle' && score.value <= 4) || 
                        (!['wordle', 'tightrope', 'quordle'].includes(game.id) && score.value >= game.maxScore * 0.7)
                        ? 'Good'
                        : 'Fair'}
                  </div>
                </div>
              ))
            }
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-2">You haven't recorded any scores for this game yet</p>
          <Button onClick={onAddScore} disabled={!user}>
            Add Your First Score
          </Button>
        </div>
      )}
    </>
  );
};

export default ScoreList;
