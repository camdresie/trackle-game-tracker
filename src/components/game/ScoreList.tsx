
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Game, Score } from '@/utils/types';
import { getScoreLabel, getScoreColor } from '@/utils/scoreUtils';
import { Trash2 } from 'lucide-react';
import { deleteGameScore } from '@/services/scoreService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { isToday } from '@/utils/dateUtils';

interface ScoreListProps {
  scores: Score[];
  game: Game;
  onAddScore: () => void;
  user: any;
  onScoreDeleted?: (scoreId: string) => void;
}

const ScoreList = ({ scores, game, onAddScore, user, onScoreDeleted }: ScoreListProps) => {
  const [isDeletingScore, setIsDeletingScore] = useState(false);
  const [scoreToDelete, setScoreToDelete] = useState<Score | null>(null);

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

  const handleDeleteClick = (score: Score) => {
    setScoreToDelete(score);
  };

  const confirmDelete = async () => {
    if (!scoreToDelete) return;
    
    setIsDeletingScore(true);
    try {
      const success = await deleteGameScore(scoreToDelete.id);
      if (success) {
        toast.success('Score deleted successfully');
        if (onScoreDeleted) {
          onScoreDeleted(scoreToDelete.id);
        }
      }
    } catch (error) {
      console.error('Error deleting score:', error);
      toast.error('Failed to delete score');
    } finally {
      setIsDeletingScore(false);
      setScoreToDelete(null);
    }
  };

  const cancelDelete = () => {
    setScoreToDelete(null);
  };

  // Check if a score is from today
  const scoreIsFromToday = (score: Score) => isToday(score.date);

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
                  <div className="flex items-center gap-2">
                    <div className={getScoreColor(score.value, game, undefined)}>
                      {getScoreLabel(score.value, game, undefined)}
                    </div>
                    {scoreIsFromToday(score) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(score)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

      <AlertDialog open={!!scoreToDelete} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete score?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your score for today. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingScore}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeletingScore}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingScore ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ScoreList;
