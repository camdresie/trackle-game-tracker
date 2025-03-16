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
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Game, Score } from '@/utils/types';
import { toast } from 'sonner';
import { addGameScore } from '@/services/gameStatsService';
import { useAuth } from '@/contexts/AuthContext';
import { formatInTimeZone } from 'date-fns-tz';

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
  const [value, setValue] = useState(
    game.id === 'wordle' ? 3 : 
    game.id === 'tightrope' ? 1170 : // Default to middle value for Tightrope (2340/2)
    Math.floor((game.maxScore || 100) / 2)
  );
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
  
  // Calculate values for the slider labels
  const getSliderMarkers = () => {
    if (game.id === 'wordle') {
      // For Wordle with fixed positions (1-6)
      return [1, 2, 3, 4, 5, 6];
    } else if (game.id === 'tightrope') {
      // For Tightrope with range 0-2340
      return [0, 585, 1170, 1755, 2340];
    } else {
      // For other games, calculate evenly spaced values
      const maxScore = game.maxScore || 100;
      const step = maxScore / 4;
      return [
        0,
        Math.round(step),
        Math.round(step * 2),
        Math.round(step * 3),
        maxScore
      ];
    }
  };
  
  // Calculate the Quordle aggregate score
  const calculateQuordleScore = () => {
    return quordleValues.reduce((sum, val) => sum + val, 0);
  };
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to add scores');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For Quordle, use the aggregate score from all 4 words
      const scoreValue = game.id === 'quordle' ? calculateQuordleScore() : value;
      
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
      setValue(
        game.id === 'wordle' ? 3 : 
        game.id === 'tightrope' ? 1170 : 
        Math.floor((game.maxScore || 100) / 2)
      );
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
  
  // Logic for what "good score" means varies by game
  const getScoreLabel = () => {
    if (game.id === 'wordle') {
      return value <= 3 ? 'Excellent' : value <= 5 ? 'Good' : 'Fair';
    } else if (game.id === 'tightrope') {
      const percentage = (value / (game.maxScore || 2340)) * 100;
      return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
    } else if (game.id === 'quordle') {
      const score = calculateQuordleScore();
      return score <= 20 ? 'Excellent' : score <= 28 ? 'Good' : 'Fair';
    } else {
      const percentage = (value / (game.maxScore || 100)) * 100;
      return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
    }
  };
  
  // Custom styling based on score
  const getScoreColor = () => {
    if (game.id === 'wordle') {
      return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
    } else if (game.id === 'quordle') {
      const score = calculateQuordleScore();
      return score <= 20 ? 'text-emerald-500' : score <= 28 ? 'text-amber-500' : 'text-rose-500';
    } else {
      const percentage = (value / (game.maxScore || 100)) * 100;
      return percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500';
    }
  };
  
  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseInt(e.target.value);
    
    if (isNaN(inputValue)) {
      return;
    }
    
    // Ensure value is within valid range
    let newValue = inputValue;
    
    if (game.id === 'wordle') {
      newValue = Math.max(1, Math.min(game.maxScore || 6, inputValue));
    } else {
      newValue = Math.max(0, Math.min(game.maxScore || 100, inputValue));
    }
    
    setValue(newValue);
  };
  
  // Completely rewritten Quordle input changes handler
  const handleQuordleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`Quordle input change for word ${index + 1}: '${e.target.value}'`);
    
    // Create a new copy of the current values array
    const newQuordleValues = [...quordleValues];
    
    // Handle different types of input
    if (e.target.value === '') {
      // Empty input - this happens when user clears the field (e.g. with backspace)
      console.log(`Setting word ${index + 1} to default value 7 (empty input)`);
      newQuordleValues[index] = 7;
    } else if (e.target.value.toLowerCase() === 'x') {
      // "X" input for failed attempts
      console.log(`Setting word ${index + 1} to 9 (X input)`);
      newQuordleValues[index] = 9;
    } else {
      // Try to parse as a number
      const numValue = parseInt(e.target.value);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 9) {
        console.log(`Setting word ${index + 1} to numeric value: ${numValue}`);
        newQuordleValues[index] = numValue;
      } else {
        // Invalid input - ignore it and keep previous value
        console.log(`Invalid input for word ${index + 1}: '${e.target.value}', keeping previous value: ${quordleValues[index]}`);
        return; // Don't update state for invalid inputs
      }
    }
    
    // Update state with the new values
    setQuordleValues(newQuordleValues);
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
            <div className="space-y-3">
              <label className="text-sm font-medium">Score for 4 words (1-9 or X for fail)</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-xs text-muted-foreground">Word {index + 1}</label>
                    <Input
                      type="text"
                      value={quordleValues[index] === 9 ? 'X' : quordleValues[index].toString()}
                      onChange={(e) => handleQuordleInputChange(index, e)}
                      className="text-center"
                      maxLength={1}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Total Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{calculateQuordleScore()}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${getScoreColor()} bg-secondary`}>
                    {getScoreLabel()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <p>Lower numbers are better. Use X or 9 for failed words.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Score</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={value}
                    onChange={handleInputChange}
                    className="w-20 text-right"
                    min={game.id === 'wordle' ? 1 : 0}
                    max={game.maxScore}
                  />
                  <span className="text-xs text-muted-foreground">
                    / {game.maxScore}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${getScoreColor()} bg-secondary`}>
                    {getScoreLabel()}
                  </span>
                </div>
              </div>
              
              <Slider
                min={game.id === 'wordle' ? 1 : 0}
                max={game.maxScore}
                step={1}
                value={[value]}
                onValueChange={(val) => setValue(val[0])}
                className="py-2"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                {getSliderMarkers().map((markerValue, i) => (
                  <div key={i} className="flex-shrink-0 w-6 text-center">
                    {markerValue}
                  </div>
                ))}
              </div>
            </div>
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
