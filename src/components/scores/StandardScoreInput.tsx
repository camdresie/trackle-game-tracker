
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { getScoreColor, getScoreLabel, getSliderMarkers } from '@/utils/scoreUtils';
import { Game } from '@/utils/types';

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

  // Set step to 1 for discrete games (Wordle, Framed) and use appropriate scaling for others
  const isDiscreteGame = game.id === 'wordle' || game.id === 'framed';
  
  // Get markers for the slider
  const markers = getSliderMarkers(game);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Score</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            className="w-20 text-right"
            min={game.id === 'wordle' || game.id === 'framed' ? 1 : 0}
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
      
      <Slider
        min={game.id === 'wordle' || game.id === 'framed' ? 1 : 0}
        max={game.maxScore}
        step={1}
        value={[value]}
        onValueChange={handleSliderChange}
        className={`py-2 ${isDiscreteGame ? 'discrete-slider' : ''}`}
      />
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        {markers.map((markerValue, i) => (
          <div 
            key={i} 
            className={`flex-shrink-0 w-6 text-center ${isDiscreteGame ? 'discrete-marker' : ''}`}
            style={isDiscreteGame ? { marginLeft: markerValue === 1 ? '-0.35rem' : '0' } : {}}
          >
            {markerValue}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StandardScoreInput;
