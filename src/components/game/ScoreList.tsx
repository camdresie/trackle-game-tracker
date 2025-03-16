
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

  // Format score value based on game type
  const formatScoreValue = (score: number, gameId: string) => {
    if (gameId === 'mini-crossword') {
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return score;
  };

  // Determine score rating
  const getScoreRating = (score: number, gameId: string) => {
    if (gameId === 'wordle' && score <= 3) {
      return 'Excellent';
    } else if (gameId === 'wordle' && score <= 4) {
      return 'Good';
    } else if (gameId === 'mini-crossword') {
      // For Mini Crossword, LOWER is better (it's time-based)
      if (score < 120) { // Less than 2 minutes
        return 'Excellent';
      } else if (score < 240) { // Less than 4 minutes
        return 'Good';
      } else {
        return 'Fair';
      }
    } else if (!['wordle', 'mini-crossword'].includes(gameId) && score >= game.maxScore * 0.8) {
      return 'Excellent';
    } else if (!['wordle', 'mini-crossword'].includes(gameId) && score >= game.maxScore * 0.7) {
      return 'Good';
    }
    return 'Fair';
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
                      <span className="text-xl font-bold">{formatScoreValue(score.value, game.id)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{formatDate(score.date)}</div>
                      {score.notes && (
                        <div className="text-sm text-muted-foreground">{score.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className={
                    getScoreRating(score.value, game.id) === 'Excellent' 
                      ? 'text-emerald-500' 
                      : getScoreRating(score.value, game.id) === 'Good'
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                  }>
                    {getScoreRating(score.value, game.id)}
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
