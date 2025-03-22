
import { Game } from '@/utils/types';

// Calculate what "good score" means for each game
export const getScoreLabel = (value: number, game: Game, quordleValues?: number[]) => {
  if (game.id === 'wordle' || game.id === 'framed') {
    return value <= 3 ? 'Excellent' : value <= 5 ? 'Good' : 'Fair';
  } else if (game.id === 'connections') {
    if (value === 8) return 'Loss';
    return value <= 5 ? 'Excellent' : value <= 7 ? 'Good' : 'Fair';
  } else if (game.id === 'betweenle') {
    return value >= 4 ? 'Excellent' : value >= 2 ? 'Good' : value > 0 ? 'Fair' : 'Loss';
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
    // Updated thresholds - Excellent starts at 150 points
    return value >= 150 ? 'Excellent' : value >= 100 ? 'Good' : 'Fair';
  } else {
    const percentage = (value / (game.maxScore || 100)) * 100;
    return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
  }
};

// Get color styling based on score
export const getScoreColor = (value: number, game: Game, quordleValues?: number[]) => {
  if (game.id === 'wordle' || game.id === 'framed') {
    return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'connections') {
    if (value === 8) return 'text-gray-500';
    return value <= 5 ? 'text-emerald-500' : value <= 7 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'betweenle') {
    return value >= 4 ? 'text-emerald-500' : value >= 2 ? 'text-amber-500' : value > 0 ? 'text-rose-500' : 'text-gray-500';
  } else if (game.id === 'mini-crossword') {
    // For Mini Crossword, LOWER is better (it's time-based)
    return value < 90 ? 'text-emerald-500' : value < 180 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'quordle') {
    const score = quordleValues 
      ? quordleValues.reduce((sum, val) => sum + (val === 10 ? 10 : val), 0)
      : 0;
    return score <= 20 ? 'text-emerald-500' : score <= 28 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'squardle') {
    // Updated color thresholds to match the new score thresholds
    return value >= 150 ? 'text-emerald-500' : value >= 100 ? 'text-amber-500' : 'text-rose-500';
  } else {
    const percentage = (value / (game.maxScore || 100)) * 100;
    return percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500';
  }
};

// Calculate slider marker positions
export const getSliderMarkers = (game: Game) => {
  if (game.id === 'wordle' || game.id === 'framed') {
    // For Wordle and Framed with fixed positions (1-6)
    // We display exactly the possible discrete values to ensure perfect alignment
    return [1, 2, 3, 4, 5, 6];
  } else if (game.id === 'connections') {
    // For Connections with range 4-8
    return [4, 5, 6, 7, 8];
  } else if (game.id === 'betweenle') {
    // For Betweenle with range 0-5
    return [0, 1, 2, 3, 4, 5];
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
  return game.id === 'wordle' || game.id === 'framed' ? 3 : 
         game.id === 'connections' ? 6 : // Default to middle value for Connections
         game.id === 'betweenle' ? 3 : // Default to middle value for Betweenle
         game.id === 'mini-crossword' ? 120 : // Default to 2 minutes for Mini Crossword
         game.id === 'tightrope' ? 1170 : // Default to middle value for Tightrope (2340/2)
         game.id === 'squardle' ? 150 : // Default to middle value for Squardle (300/2)
         Math.floor((game.maxScore || 100) / 2);
};
