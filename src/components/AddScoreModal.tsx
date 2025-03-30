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
import { addGameScore, checkExistingScore } from '@/services/scoreService';
import { useAuth } from '@/contexts/AuthContext';
import { formatInTimeZone } from 'date-fns-tz';
import QuordleScoreInput from './scores/QuordleScoreInput';
import StandardScoreInput from './scores/StandardScoreInput';
import { getDefaultValue, calculateQuordleScore } from '@/utils/scoreUtils';
import { getTodayInEasternTime } from '@/utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AddScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  onAddScore: (score: Score) => void;
  existingScores?: Score[];
}

const AddScoreModal = ({ 
  open, 
  onOpenChange, 
  game,
  onAddScore,
  existingScores = [] 
}: AddScoreModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(getDefaultValue(game));
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingScoreId, setExistingScoreId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  
  // For Quordle, we use separate inputs for each word
  const [quordleValues, setQuordleValues] = useState([7, 7, 7, 7]);
  
  // Set the date to today's date in Eastern Time when the modal opens
  // and check if we're editing an existing score
  useEffect(() => {
    if (open) {
      // Get today's date in Eastern Time (ET) in YYYY-MM-DD format
      const todayInET = getTodayInEasternTime();
      console.log('Setting date picker to today in Eastern Time:', todayInET);
      setDate(todayInET);
      
      // Check if there's already a score for today
      const todayScore = existingScores.find(score => score.date === todayInET);
      
      if (todayScore) {
        console.log('Found existing score for today:', todayScore);
        setIsEditMode(true);
        setExistingScoreId(todayScore.id);
        setValue(todayScore.value);
        setNotes(todayScore.notes || '');
        
        // Show notes section if there are existing notes
        setShowNotes(!!todayScore.notes);
        
        // For Quordle, we need to reverse engineer the individual values
        if (game.id === 'quordle') {
          // This is a simplified approach - in a real app you would store the individual values
          const estimatedValues = [7, 7, 7, 7];
          setQuordleValues(estimatedValues);
        }
      } else {
        // Reset values if no score exists
        setIsEditMode(false);
        setExistingScoreId(null);
        setValue(getDefaultValue(game));
        setQuordleValues([7, 7, 7, 7]);
        setNotes('');
        setShowNotes(false);
      }
    }
  }, [open, existingScores, game]);
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to add scores');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For Quordle, use the aggregate score from all 4 words
      const scoreValue = game.id === 'quordle' ? calculateQuordleScore(quordleValues) : value;
      
      console.log(`Submitting score: ${scoreValue} for game ${game.id}`);
      
      // Make sure we're passing the existing ID if we're in edit mode
      const newScore = {
        gameId: game.id,
        playerId: user.id,
        value: scoreValue,
        date,
        notes: notes || undefined,
        createdAt: new Date().toISOString(), 
        id: existingScoreId || undefined // Include ID if editing
      };
      
      // Make sure to pass isUpdate flag properly
      const { stats, score } = await addGameScore(newScore, isEditMode);
      
      console.log('Received response from addGameScore:', score);
      
      // Update local UI with the new score
      onAddScore({
        id: score.id,
        gameId: score.gameId,
        playerId: score.playerId,
        value: score.value,
        date: score.date,
        notes: score.notes || '',
        createdAt: score.createdAt
      });
      
      // Invalidate relevant queries to refresh the data using a common parent key
      queryClient.invalidateQueries({ 
        queryKey: ['game-data', 'scores'] 
      });
      
      toast.success(`Your ${game.name} score has been ${isEditMode ? 'updated' : 'saved'}.`);
      
      // Reset form and close modal
      setValue(getDefaultValue(game));
      setQuordleValues([7, 7, 7, 7]);
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding score:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'save'} score. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle score changes from child components
  const handleStandardScoreChange = (newValue: number) => {
    console.log(`Standard score changed to: ${newValue}`);
    setValue(newValue);
  };
  
  const handleQuordleScoreChange = (newValues: number[]) => {
    console.log(`Quordle score changed to: ${newValues.join(', ')}`);
    setQuordleValues(newValues);
  };

  const toggleNotes = () => {
    setShowNotes(!showNotes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit ${game.name} Score` : `Add ${game.name} Score`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6 md:space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayInEasternTime()}
              disabled={isEditMode} // Prevent editing the date in edit mode
            />
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                You can only edit today's score. The date cannot be changed.
              </p>
            )}
          </div>
          
          {game.id === 'quordle' ? (
            <QuordleScoreInput 
              game={game} 
              initialValues={quordleValues}
              onScoreChange={handleQuordleScoreChange} 
            />
          ) : (
            <StandardScoreInput 
              game={game} 
              initialValue={value}
              onScoreChange={handleStandardScoreChange} 
            />
          )}
          
          <div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="flex items-center justify-between w-full p-2 text-sm font-medium text-left" 
              onClick={toggleNotes}
            >
              <span>Notes {notes && !showNotes ? "(Added)" : "(optional)"}</span>
              {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showNotes && (
              <div className="mt-2">
                <Textarea
                  placeholder="Add any notes about your game..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>
            )}
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
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Score' : 'Save Score'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddScoreModal;
