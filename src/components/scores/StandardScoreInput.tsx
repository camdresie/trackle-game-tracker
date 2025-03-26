
import { useState, useEffect } from 'react';
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
  
  // Ensure the local state stays in sync with the prop
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseInt(e.target.value);
    
    if (isNaN(inputValue)) {
      return;
    }
    
    // Ensure value is within valid range
    let newValue = inputValue;
    
    if (game.id === 'wordle') {
      newValue = Math.max(1, Math.min(game.maxScore || 7, inputValue));
    } else if (game.id === 'framed') {
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
    console.log(`StandardScoreInput: value changed to ${newValue} via input`);
    onScoreChange(newValue);
  };
  
  // Handle slider change
  const handleSliderChange = (newValues: number[]) => {
    const newValue = newValues[0];
    setValue(newValue);
    console.log(`StandardScoreInput: value changed to ${newValue} via slider`);
    onScoreChange(newValue);
  };

  // Get min value based on game
  const getMinValue = () => {
    if (game.id === 'connections') return 4;
    if (['wordle', 'framed', 'nerdle'].includes(game.id)) return 1;
    return 0;
  };
  
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
