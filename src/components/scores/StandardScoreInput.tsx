
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { getScoreColor, getScoreLabel, getSliderMarkers } from '@/utils/scoreUtils';
import { Game } from '@/utils/types';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface StandardScoreInputProps {
  game: Game;
  initialValue: number;
  onScoreChange: (value: number) => void;
}

const StandardScoreInput = ({ game, initialValue, onScoreChange }: StandardScoreInputProps) => {
  const [value, setValue] = useState(initialValue);
  
  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseInt(e.target.value);
    
    if (isNaN(inputValue)) {
      return;
    }
    
    // Ensure value is within valid range
    let newValue = inputValue;
    
    if (game.id === 'wordle' || game.id === 'framed') {
      newValue = Math.max(1, Math.min(game.maxScore || 6, inputValue));
    } else if (game.id === 'connections') {
      newValue = Math.max(4, Math.min(game.maxScore || 8, inputValue));
    } else if (game.id === 'betweenle') {
      newValue = Math.max(0, Math.min(game.maxScore || 5, inputValue));
    } else if (game.id === 'nerdle') {
      newValue = Math.max(1, Math.min(game.maxScore || 7, inputValue));
    } else if (game.id === 'spelling-bee') {
      newValue = Math.max(0, Math.min(game.maxScore || 137, inputValue));
    } else if (game.id === 'squardle') {
      newValue = Math.max(0, Math.min(game.maxScore || 10, inputValue));
    } else {
      newValue = Math.max(0, Math.min(game.maxScore || 100, inputValue));
    }
    
    setValue(newValue);
    onScoreChange(newValue);
  };
  
  // Handle slider change
  const handleSliderChange = (val: number[]) => {
    setValue(val[0]);
    onScoreChange(val[0]);
  };

  // Set step to 1 for discrete games (Wordle, Framed, Connections, Betweenle, Nerdle) and use appropriate scaling for others
  const isDiscreteGame = ['wordle', 'framed', 'connections', 'betweenle', 'nerdle', 'squardle'].includes(game.id);
  
  // Get markers for the slider
  const markers = getSliderMarkers(game);
  
  // Get min value based on game
  const getMinValue = () => {
    if (game.id === 'connections') return 4;
    if (['wordle', 'framed', 'nerdle'].includes(game.id)) return 1;
    return 0;
  };
  
  // Calculate marker positions with proper spacing
  const calculateMarkerPosition = (markerValue: number, index: number): string => {
    if (!isDiscreteGame) return '';
    
    const min = getMinValue();
    const max = game.maxScore || 100;
    const range = max - min;
    
    // Special handling for Nerdle
    if (game.id === 'nerdle') {
      // For Nerdle (1-7), we need to ensure the markers are evenly distributed
      const percentage = ((markerValue - min) / range) * 100;
      return `left: ${percentage}%`;
    }
    
    return '';
  };
  
  // Get help text based on game
  const getHelpText = () => {
    if (game.id === 'squardle') {
      return "Enter remaining guesses (10 = perfect score, 0 = failed)";
    }
    return null;
  };
  
  const helpText = getHelpText();
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium">Score</label>
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={16} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  {helpText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            className="w-20 text-right"
            min={getMinValue()}
            max={game.maxScore}
          />
          <span className="text-xs text-muted-foreground">
            / {game.maxScore}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${getScoreColor(value, game)} bg-secondary`}>
            {getScoreLabel(value, game)}
          </span>
        </div>
      </div>
      
      {game.id === 'squardle' && (
        <div className="text-xs text-muted-foreground mt-1">
          For Squardle, enter the number of guesses remaining (10 = perfect score, 0 = failed).
        </div>
      )}
      
      <Slider
        min={getMinValue()}
        max={game.maxScore}
        step={1}
        value={[value]}
        onValueChange={handleSliderChange}
        className="py-2"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1 relative">
        {markers.map((markerValue, i) => (
          <div 
            key={i} 
            className="absolute text-center transform -translate-x-1/2"
            style={{
              left: `${((markerValue - getMinValue()) / (game.maxScore - getMinValue())) * 100}%`,
              width: '1.5rem'
            }}
          >
            {markerValue}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StandardScoreInput;
