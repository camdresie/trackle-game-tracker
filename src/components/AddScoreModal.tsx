
import { useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';

interface AddScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  playerId: string;
  onAddScore: (score: Score) => void;
}

const AddScoreModal = ({ 
  open, 
  onOpenChange, 
  game, 
  playerId,
  onAddScore 
}: AddScoreModalProps) => {
  const { toast } = useToast();
  const [value, setValue] = useState(
    game.id === 'wordle' ? 3 : Math.floor(game.maxScore / 2)
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  const handleSubmit = () => {
    const newScore: Score = {
      id: `score-${Date.now()}`,
      gameId: game.id,
      playerId,
      value,
      date,
      notes: notes || undefined
    };
    
    onAddScore(newScore);
    toast({
      title: 'Score added',
      description: `Your ${game.name} score has been saved.`,
      duration: 3000
    });
    
    onOpenChange(false);
    
    // Reset form
    setValue(game.id === 'wordle' ? 3 : Math.floor(game.maxScore / 2));
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };
  
  // Logic for what "good score" means varies by game
  const getScoreLabel = () => {
    if (game.id === 'wordle') {
      return value <= 3 ? 'Excellent' : value <= 5 ? 'Good' : 'Fair';
    } else {
      const percentage = (value / game.maxScore) * 100;
      return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
    }
  };
  
  // Custom styling based on score
  const getScoreColor = () => {
    if (game.id === 'wordle') {
      return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
    } else {
      const percentage = (value / game.maxScore) * 100;
      return percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500';
    }
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
                <span className={`text-lg font-semibold ${getScoreColor()}`}>
                  {value}
                </span>
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
            
            <div className="grid grid-cols-5 gap-1 text-xs text-muted-foreground pt-1">
              {[...Array(5)].map((_, i) => {
                const value = game.id === 'wordle' 
                  ? Math.max(1, Math.round((i + 1) * game.maxScore / 5))
                  : Math.round(i * game.maxScore / 4);
                  
                return (
                  <div key={i} className="text-center">
                    {value}
                  </div>
                );
              })}
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
          <Button onClick={handleSubmit}>Save Score</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddScoreModal;
