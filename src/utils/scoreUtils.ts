import { Game } from '@/utils/types';

// Calculate what "good score" means for each game
export const getScoreLabel = (value: number, game: Game, quordleValues?: number[]) => {
  if (game.id === 'wordle') {
    return value <= 3 ? 'Excellent' : value <= 5 ? 'Good' : 'Fair';
  } else if (game.id === 'mini-crossword') {
    // For Mini Crossword, LOWER is better (it's time-based)
    return value < 90 ? 'Excellent' : value < 180 ? 'Good' : 'Fair';
  } else if (game.id === 'tightrope') {
    const percentage = (value / (game.maxScore || 2340)) * 100;
    return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
  } else if (game.id === 'quordle') {
    const score = quordleValues 
      ? quordleValues.reduce((sum, val) => sum + (val === 10 ? 10 : val), 0)
      : 0;
    return score <= 20 ? 'Excellent' : score <= 28 ? 'Good' : 'Fair';
  } else if (game.id === 'squardle') {
    const percentage = (value / 300) * 100;
    return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
  } else {
    const percentage = (value / (game.maxScore || 100)) * 100;
    return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
  }
};

// Get color styling based on score
export const getScoreColor = (value: number, game: Game, quordleValues?: number[]) => {
  if (game.id === 'wordle') {
    return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'mini-crossword') {
    // For Mini Crossword, LOWER is better (it's time-based)
    return value < 90 ? 'text-emerald-500' : value < 180 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'quordle') {
    const score = quordleValues 
      ? quordleValues.reduce((sum, val) => sum + (val === 10 ? 10 : val), 0)
      : 0;
    return score <= 20 ? 'text-emerald-500' : score <= 28 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'squardle') {
    const percentage = (value / 300) * 100;
    return percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500';
  } else {
    const percentage = (value / (game.maxScore || 100)) * 100;
    return percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500';
  }
};

// Calculate slider marker positions
export const getSliderMarkers = (game: Game) => {
  if (game.id === 'wordle') {
    // For Wordle with fixed positions (1-6)
    return [1, 2, 3, 4, 5, 6];
  } else if (game.id === 'mini-crossword') {
    // For Mini Crossword with range 0-300
    return [0, 60, 120, 180, 240, 300];
  } else if (game.id === 'tightrope') {
    // For Tightrope with range 0-2340
    return [0, 585, 1170, 1755, 2340];
  } else if (game.id === 'squardle') {
    // For Squardle with range 0-300
    return [0, 75, 150, 225, 300];
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
export const calculateQuordleScore = (quordleValues: number[]) => {
  // Uses 10 for each 'X' (failed attempt)
  return quordleValues.reduce((sum, val) => sum + (val === 10 ? 10 : val), 0);
};

// Get default value based on game type
export const getDefaultValue = (game: Game) => {
  return game.id === 'wordle' ? 3 : 
         game.id === 'mini-crossword' ? 120 : // Default to 2 minutes for Mini Crossword
         game.id === 'tightrope' ? 1170 : // Default to middle value for Tightrope (2340/2)
         game.id === 'squardle' ? 150 : // Default to middle value for Squardle (300/2)
         Math.floor((game.maxScore || 100) / 2);
};
