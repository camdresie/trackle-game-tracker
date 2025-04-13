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
import { Info } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingScoreId, setExistingScoreId] = useState<string | null>(null);
  
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

  // Helper function to get scoring description based on game ID
  const getScoringDescription = (gameId: string): string => {
    switch (gameId) {
      case 'wordle':
        return 'Score is the number of guesses (1-6). Use 7 for a missed word. Lower is better.';
      case 'connections':
        return 'Score is the number of guesses to get all 4 categories. Use 8 if you failed to get all categories. Lower is better.';
      case 'mini-crossword':
        return 'Score is the time taken in seconds. Lower is better.';
      case 'framed':
        return 'Score is the number of guesses (1-6). Use 7 to indicate if you were unable to get the movie. Lower is better.';
      case 'quordle':
        return 'Total score is the sum of guesses (1-9) it took to guess each word. Use 10/X for a failed word. Lower is better.';
      case 'betweenle':
        return 'Score is points earned (0-5) as displayed in the top right of Betweenle after guessing the word. Use 0 if you were unable to get the word. Higher is better.';
      case 'spelling-bee':
        return 'Score is points earned. Higher is better.';
      case 'tightrope':
        return 'Score is points earned. Higher is better.';
      case 'nerdle':
        return 'Score is the number of guesses (1-6). Use 7 to indicate a loss. Lower is better.';
      case 'squardle':
        return 'Score is the number of guesses remaining (0-10). Use 0 if you were unable to solve the puzzle. Higher is better.';
      case 'minute-cryptic':
        return 'Score reflects hints needed (-3 to +10). Use 0 for par. Lower (par or under) is better.';
      default:
        return ''; // Or a default message
    }
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
          
          {/* Scoring Description */}
          <div className="flex items-start space-x-2 text-xs text-muted-foreground pt-2">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{getScoringDescription(game.id)}</span>
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
