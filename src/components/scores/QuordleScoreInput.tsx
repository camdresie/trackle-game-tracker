
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { calculateQuordleScore } from '@/utils/scoreUtils';
import { getScoreColor, getScoreLabel } from '@/utils/scoreUtils';
import { Game } from '@/utils/types';

interface QuordleScoreInputProps {
  game: Game;
  initialValues?: number[];
  onScoreChange: (values: number[]) => void;
}

const QuordleScoreInput = ({ game, initialValues = [7, 7, 7, 7], onScoreChange }: QuordleScoreInputProps) => {
  // State for Quordle inputs
  const [quordleValues, setQuordleValues] = useState(initialValues);
  const [quordleDisplayValues, setQuordleDisplayValues] = useState(
    initialValues.map(val => val === 10 ? 'X' : val.toString())
  );
  
  // Update internal state when prop values change
  useEffect(() => {
    if (initialValues) {
      setQuordleValues(initialValues);
      setQuordleDisplayValues(initialValues.map(val => val === 10 ? 'X' : val.toString()));
    }
  }, [initialValues]);
  
  // Completely revamped Quordle input handling
  const handleQuordleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    // Create a copy of the display values array
    const newDisplayValues = [...quordleDisplayValues];
    // Set the display value to whatever the user typed
    newDisplayValues[index] = e.target.value;
    setQuordleDisplayValues(newDisplayValues);
    
    console.log(`Quordle input change for word ${index + 1}: '${e.target.value}'`);
    
    // Now process the input to update the actual values
    const newQuordleValues = [...quordleValues];
    
    if (e.target.value === '') {
      // Empty input means user is editing - keep the display empty but don't update the value yet
      console.log(`User is editing word ${index + 1} (field emptied)`);
    } else if (e.target.value.toLowerCase() === 'x') {
      // "X" input for failed attempts - now worth 10 points instead of 9
      console.log(`Setting word ${index + 1} to 10 (X input)`);
      newQuordleValues[index] = 10; // Changed from 9 to 10
      setQuordleValues(newQuordleValues);
      onScoreChange(newQuordleValues);
    } else {
      // Try to parse as a number
      const numValue = parseInt(e.target.value);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 9) {
        console.log(`Setting word ${index + 1} to numeric value: ${numValue}`);
        newQuordleValues[index] = numValue;
        setQuordleValues(newQuordleValues);
        onScoreChange(newQuordleValues);
      }
    }
  };
  
  // Handle the onBlur event for Quordle inputs to restore default values when needed
  const handleQuordleInputBlur = (index: number) => {
    const displayValue = quordleDisplayValues[index];
    const newDisplayValues = [...quordleDisplayValues];
    const newQuordleValues = [...quordleValues];
    
    // If empty or invalid, restore to default
    if (displayValue === '' || (displayValue !== 'X' && displayValue !== 'x' && (isNaN(parseInt(displayValue)) || parseInt(displayValue) < 1 || parseInt(displayValue) > 9))) {
      newDisplayValues[index] = '7'; // Default display
      newQuordleValues[index] = 7; // Default value
      console.log(`Restoring word ${index + 1} to default 7 (invalid input on blur)`);
      
      setQuordleDisplayValues(newDisplayValues);
      setQuordleValues(newQuordleValues);
      onScoreChange(newQuordleValues);
    }
  };
  
  // Get the total score for display
  const totalScore = calculateQuordleScore(quordleValues);
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Score for 4 words (1-9 or X for fail)</label>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="space-y-1">
            <label className="text-xs text-muted-foreground">Word {index + 1}</label>
            <Input
              type="text"
              value={quordleDisplayValues[index]}
              onChange={(e) => handleQuordleInputChange(index, e)}
              onBlur={() => handleQuordleInputBlur(index)}
              className="text-center"
              maxLength={1}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-2 border-t">
        <span className="text-sm font-medium">Total Score</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">{totalScore}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${getScoreColor(0, game, quordleValues)} bg-secondary`}>
            {getScoreLabel(0, game, quordleValues)}
          </span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        <p>Lower numbers are better. Use X or 10 for failed words (worth 10 points).</p>
      </div>
    </div>
  );
};

export default QuordleScoreInput;
