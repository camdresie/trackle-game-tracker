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
      newValue = Math.max(1, Math.min(game.maxScore || 7, inputValue));
    } else if (game.id === 'worldle') {
      newValue = Math.max(1, Math.min(game.maxScore || 7, inputValue));
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
    } else if (game.id === 'minute-cryptic') {
      // For Minute Cryptic, allow scores from -3 to +10
      newValue = Math.max(-3, Math.min(10, inputValue));
    } else if (game.id === 'waffle') {
      newValue = Math.max(0, Math.min(game.maxScore || 6, inputValue));
    } else if (game.id === 'sqnces-6' || game.id === 'sqnces-7' || game.id === 'sqnces-8') {
      newValue = Math.max(1, Math.min(game.maxScore || 7, inputValue));
    } else {
      newValue = Math.max(0, Math.min(game.maxScore || 100, inputValue));
    }
    
    setValue(newValue);
    onScoreChange(newValue);
  };
  
  // Handle slider change
  const handleSliderChange = (newValues: number[]) => {
    if (newValues && newValues.length > 0) {
      const newValue = newValues[0];
      setValue(newValue);
      onScoreChange(newValue);
    }
  };

  // Get min value based on game
  const getMinValue = () => {
    if (game.id === 'connections') return 4;
    if (['wordle', 'framed', 'nerdle', 'worldle', 'sqnces-6', 'sqnces-7', 'sqnces-8'].includes(game.id)) return 1;
    if (game.id === 'minute-cryptic') return -3;
    return 0;
  };

  // Get max value based on game
  const getMaxValue = () => {
    if (game.id === 'minute-cryptic') return 10;
    return game.maxScore || 100;
  };

  // Get step value based on game
  const getStepValue = () => {
    return 1;
  };

  // Format the display value
  const formatDisplayValue = (val: number) => {
    if (game.id === 'minute-cryptic' && val === 0) {
      return 'Par';
    }
    return val.toString();
  };

  // Determine if we should show the number input
  const showNumberInput = !['wordle', 'framed', 'nerdle'].includes(game.id);

  // Get markers for the slider
  const markers = getSliderMarkers(game);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Score</label>
        <div className="flex items-center gap-2">
          {showNumberInput && (
            <Input
              type="number"
              value={value}
              onChange={handleInputChange}
              className="w-20 text-right"
              min={getMinValue()}
              max={getMaxValue()}
            />
          )}
          {showNumberInput && (
            <span className="text-xs text-muted-foreground">
              / {getMaxValue()}
            </span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${getScoreColor(value, game)} bg-secondary`}>
            {getScoreLabel(value, game)}
          </span>
        </div>
      </div>
      
      <Slider
        min={getMinValue()}
        max={getMaxValue()}
        step={getStepValue()}
        value={[value]}
        onValueChange={handleSliderChange}
        className="py-2"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1 relative pb-4">
        {markers.map((markerValue, i) => (
          <div 
            key={i} 
            className="absolute text-center transform -translate-x-1/2"
            style={{
              left: `${((markerValue - getMinValue()) / (getMaxValue() - getMinValue())) * 100}%`,
              width: '1.5rem'
            }}
          >
            {formatDisplayValue(markerValue)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StandardScoreInput;
