
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
  
  // Set the date to today's date when the modal opens
  useEffect(() => {
    if (open) {
      // Get today's date in YYYY-MM-DD format that matches database storage
      const today = new Date();
      const formattedToday = today.toISOString().substring(0, 10);
      console.log('Setting date picker to today:', formattedToday);
      setDate(formattedToday);
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
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to add scores');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newScore = {
        gameId: game.id,
        playerId: user.id,
        value,
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
    } else {
      const percentage = (value / (game.maxScore || 100)) * 100;
      return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
    }
  };
  
  // Custom styling based on score
  const getScoreColor = () => {
    if (game.id === 'wordle') {
      return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
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
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
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
