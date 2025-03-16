
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Game, Score } from '@/utils/types';
import { toast } from 'sonner';
import { addGameScore } from '@/services/gameStatsService';
import { useAuth } from '@/contexts/AuthContext';
import { formatInTimeZone } from 'date-fns-tz';
import QuordleScoreInput from './scores/QuordleScoreInput';
import StandardScoreInput from './scores/StandardScoreInput';
import { getDefaultValue, calculateQuordleScore } from '@/utils/scoreUtils';

interface AddScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  onAddScore: (score: Score) => void;
}

const AddScoreModal = ({ 
  open, 
  onOpenChange, 
  game,
  onAddScore 
}: AddScoreModalProps) => {
  const { user } = useAuth();
  const [value, setValue] = useState(getDefaultValue(game));
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For Quordle, we use separate inputs for each word
  const [quordleValues, setQuordleValues] = useState([7, 7, 7, 7]);
  
  // Set the date to today's date in Eastern Time when the modal opens
  useEffect(() => {
    if (open) {
      // Get today's date in Eastern Time (ET) in YYYY-MM-DD format
      const todayInET = formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
      console.log('Setting date picker to today in Eastern Time:', todayInET);
      setDate(todayInET);
    }
  }, [open]);
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to add scores');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For Quordle, use the aggregate score from all 4 words
      const scoreValue = game.id === 'quordle' ? calculateQuordleScore(quordleValues) : value;
      
      const newScore = {
        gameId: game.id,
        playerId: user.id,
        value: scoreValue,
        date,
        notes: notes || undefined,
        createdAt: new Date().toISOString() // Add createdAt field
      };
      
      const { stats, score } = await addGameScore(newScore);
      
      // Update local UI with the new score
      onAddScore({
        id: score.id,
        ...newScore
      });
      
      toast.success(`Your ${game.name} score has been saved.`);
      onOpenChange(false);
      
      // Reset form
      setValue(getDefaultValue(game));
      setQuordleValues([7, 7, 7, 7]);
      setDate('');  // Clear the date field when modal is closed
      setNotes('');
    } catch (error) {
      console.error('Error adding score:', error);
      toast.error('Failed to save score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle score changes from child components
  const handleStandardScoreChange = (newValue: number) => {
    setValue(newValue);
  };
  
  const handleQuordleScoreChange = (newValues: number[]) => {
    setQuordleValues(newValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle>Add {game.name} Score</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd')}
            />
          </div>
          
          {game.id === 'quordle' ? (
            <QuordleScoreInput 
              game={game} 
              onScoreChange={handleQuordleScoreChange} 
            />
          ) : (
            <StandardScoreInput 
              game={game} 
              initialValue={value}
              onScoreChange={handleStandardScoreChange} 
            />
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="Add any notes about your game..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-row sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Score'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddScoreModal;
