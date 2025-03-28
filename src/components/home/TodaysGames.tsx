
import React, { useState } from 'react';
import { Score } from '@/utils/types';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGameById } from '@/utils/gameData';
import { getScoreColor, getScoreLabel } from '@/utils/scoreUtils';
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
import { deleteGameScore } from '@/services/scoreService';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface TodaysGamesProps {
  isLoading: boolean;
  todaysGames: Score[];
  gamesList: any[];
  onDeleteScore?: (scoreId: string) => void;
}

const TodaysGames = ({ isLoading, todaysGames, gamesList, onDeleteScore }: TodaysGamesProps) => {
  const queryClient = useQueryClient();
  const [scoreToDelete, setScoreToDelete] = useState<Score | null>(null);
  const [isDeletingScore, setIsDeletingScore] = useState(false);

  // Format score value (specifically for mini-crossword which uses seconds)
  const formatScoreValue = (score: number, gameId: string) => {
    if (gameId === 'mini-crossword') {
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return score;
  };
  
  const handleDeleteClick = (score: Score, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to game page
    setScoreToDelete(score);
  };
  
  const confirmDelete = async () => {
    if (!scoreToDelete) return;
    
    setIsDeletingScore(true);
    try {
      const success = await deleteGameScore(scoreToDelete.id);
      if (success) {
        toast.success('Score deleted successfully');
        if (onDeleteScore) {
          onDeleteScore(scoreToDelete.id);
        } else {
          // If no callback provided, invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['all-scores'] });
          queryClient.invalidateQueries({ queryKey: ['today-games'] });
          queryClient.invalidateQueries({ queryKey: ['game-scores'] });
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

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Today's Games</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : todaysGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {todaysGames.map((score) => {
            const game = getGameById(score.gameId, gamesList);
            if (!game) return null;
            
            return (
              <div 
                key={score.id}
                className="glass-card rounded-lg p-4 flex justify-between items-center hover:bg-secondary/10 cursor-pointer relative group"
                onClick={() => window.location.href = `/game/${score.gameId}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${game.color} flex items-center justify-center text-white`}>
                    {/* Icon would be here */}
                  </div>
                  <div>
                    <h3 className="font-medium">{game.name}</h3>
                    <div className={getScoreColor(score.value, game, undefined)}>
                      {getScoreLabel(score.value, game, undefined)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-xl font-bold mr-4">
                    {formatScoreValue(score.value, score.gameId)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteClick(score, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>You haven't recorded any scores today</p>
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
    </div>
  );
};

export default TodaysGames;
