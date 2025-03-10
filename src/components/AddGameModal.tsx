
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Game } from '@/utils/types';
import { useToast } from '@/components/ui/use-toast';

interface AddGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGame: (game: Omit<Game, 'id' | 'isCustom'>) => void;
}

const ICONS = [
  { value: 'puzzle', label: 'Puzzle' },
  { value: 'grid', label: 'Grid' },
  { value: 'layout-grid', label: 'Layout Grid' },
  { value: 'sword', label: 'Sword' },
  { value: 'dices', label: 'Dices' }
];

const COLORS = [
  { value: 'bg-emerald-500', label: 'Green' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-purple-500', label: 'Purple' },
  { value: 'bg-amber-500', label: 'Amber' },
  { value: 'bg-rose-500', label: 'Rose' },
  { value: 'bg-indigo-500', label: 'Indigo' }
];

const AddGameModal = ({ open, onOpenChange, onAddGame }: AddGameModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('puzzle');
  const [color, setColor] = useState('bg-emerald-500');
  const [maxScore, setMaxScore] = useState('6');
  
  const handleSubmit = () => {
    if (!name) {
      toast({
        title: 'Error',
        description: 'Please enter a game name',
        variant: 'destructive'
      });
      return;
    }
    
    const newGame: Omit<Game, 'id' | 'isCustom'> = {
      name,
      description,
      icon,
      color,
      maxScore: parseInt(maxScore, 10) || 6
    };
    
    onAddGame(newGame);
    toast({
      title: 'Success',
      description: `"${name}" has been added to your games.`,
      duration: 3000
    });
    
    onOpenChange(false);
    
    // Reset form
    setName('');
    setDescription('');
    setIcon('puzzle');
    setColor('bg-emerald-500');
    setMaxScore('6');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle>Add New Game</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Game Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Connections"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how the game works..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map(iconOption => (
                    <SelectItem key={iconOption.value} value={iconOption.value}>
                      {iconOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map(colorOption => (
                    <SelectItem key={colorOption.value} value={colorOption.value}>
                      {colorOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Maximum Score</label>
            <Input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              min="1"
              max="100"
            />
            <p className="text-xs text-muted-foreground">
              For games like Wordle, this is the maximum number of attempts.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Add Game</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddGameModal;
