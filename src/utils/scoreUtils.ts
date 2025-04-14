import { Game } from '@/utils/types';

// Calculate what "good score" means for each game
export const getScoreLabel = (value: number, game?: Game, quordleValues?: number[]) => {
  if (!game) return 'N/A';
  
  if (game.id === 'wordle') {
    if (value === 7) return 'Loss';
    return value <= 3 ? 'Excellent' : value <= 5 ? 'Good' : 'Fair';
  } else if (game.id === 'framed') {
    if (value === 7) return 'Loss';
    return value <= 3 ? 'Excellent' : value <= 5 ? 'Good' : 'Fair';
  } else if (game.id === 'worldle') {
    if (value === 7) return 'Loss';
    return value <= 2 ? 'Excellent' : value <= 4 ? 'Good' : 'Fair';
  } else if (game.id === 'connections') {
    if (value === 8) return 'Loss';
    return value <= 5 ? 'Excellent' : value <= 7 ? 'Good' : 'Fair';
  } else if (game.id === 'betweenle') {
    return value >= 4 ? 'Excellent' : value >= 2 ? 'Good' : value > 0 ? 'Fair' : 'Loss';
  } else if (game.id === 'nerdle') {
    if (value === 7) return 'Loss';
    return value <= 3 ? 'Excellent' : value <= 5 ? 'Good' : 'Fair';
  } else if (game.id === 'spelling-bee') {
    return value >= 90 ? 'Excellent' : value >= 50 ? 'Good' : 'Fair';
  } else if (game.id === 'mini-crossword') {
    // For Mini Crossword, LOWER is better (it's time-based)
    return value < 90 ? 'Excellent' : value < 180 ? 'Good' : 'Fair';
  } else if (game.id === 'tightrope') {
    const percentage = (value / (game.maxScore || 2340)) * 100;
    return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
  } else if (game.id === 'quordle') {
    // Use quordleValues if provided (e.g., from input), otherwise use the total value
    const score = quordleValues 
      ? quordleValues.reduce((sum, val) => sum + (val === 10 ? 10 : val), 0)
      : value; // Fallback to using the passed-in total value
      
    // Lower is better: <=15 Excellent, <=25 Good, >25 Fair/Loss (Max 40)
    if (score === 40) return 'Loss'; // All X's
    return score <= 15 ? 'Excellent' : score <= 25 ? 'Good' : 'Fair';
  } else if (game.id === 'squardle') {
    if (value === 0) return 'Loss';
    return value >= 8 ? 'Excellent' : value >= 5 ? 'Good' : 'Fair';
  } else if (game.id === 'minute-cryptic') {
    // For Minute Cryptic, lower scores are better (like golf)
    if (value <= -2) return 'Excellent';
    if (value <= 0) return 'Good';
    if (value <= 2) return 'Fair';
    return 'Poor';
  } else if (game.id === 'waffle') {
    if (value === 0) return 'Loss';
    return value >= 10 ? 'Excellent' : value >= 5 ? 'Good' : 'Fair';
  } else if (game.id === 'sqnces-6' || game.id === 'sqnces-7' || game.id === 'sqnces-8') {
    if (value === 7) return 'Loss';
    return value <= 3 ? 'Excellent' : value <= 5 ? 'Good' : 'Fair';
  } else {
    const percentage = (value / (game.maxScore || 100)) * 100;
    return percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair';
  }
};

// Get color styling based on score
export const getScoreColor = (value: number, game?: Game, quordleValues?: number[]) => {
  if (!game) return 'text-gray-500';
  
  if (game.id === 'wordle') {
    if (value === 7) return 'text-gray-500';
    return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'framed') {
    if (value === 7) return 'text-gray-500';
    return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'worldle') {
    if (value === 7) return 'text-gray-500';
    return value <= 2 ? 'text-emerald-500' : value <= 4 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'connections') {
    if (value === 8) return 'text-gray-500';
    return value <= 5 ? 'text-emerald-500' : value <= 7 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'betweenle') {
    // For Betweenle, higher is better
    return value >= 4 ? 'text-emerald-500' : value >= 2 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'nerdle') {
    if (value === 7) return 'text-gray-500';
    return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'spelling-bee') {
    return value >= 90 ? 'text-emerald-500' : value >= 50 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'mini-crossword') {
    // For Mini Crossword, LOWER is better (it's time-based)
    return value < 90 ? 'text-emerald-500' : value < 180 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'quordle') {
    // Use quordleValues if provided, otherwise use the total value for color
    const score = quordleValues 
      ? quordleValues.reduce((sum, val) => sum + (val === 10 ? 10 : val), 0)
      : value; // Fallback to using the passed-in total value
      
    // Lower is better: <=15 Green, <=25 Amber, >25 Rose
    if (score === 40) return 'text-gray-500'; // All X's
    return score <= 15 ? 'text-emerald-500' : score <= 25 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'squardle') {
    if (value === 0) return 'text-gray-500';
    return value >= 8 ? 'text-emerald-500' : value >= 5 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'minute-cryptic') {
    // For Minute Cryptic, lower scores are better (like golf)
    if (value <= -2) return 'text-emerald-500';
    if (value <= 0) return 'text-emerald-500';
    if (value <= 2) return 'text-emerald-500';
    return 'text-rose-500';
  } else if (game.id === 'waffle') {
    if (value === 0) return 'text-gray-500';
    return value >= 10 ? 'text-emerald-500' : value >= 5 ? 'text-amber-500' : 'text-rose-500';
  } else if (game.id === 'sqnces-6' || game.id === 'sqnces-7' || game.id === 'sqnces-8') {
    if (value === 7) return 'text-gray-500';
    return value <= 3 ? 'text-emerald-500' : value <= 5 ? 'text-amber-500' : 'text-rose-500';
  } else {
    const percentage = (value / (game.maxScore || 100)) * 100;
    return percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500';
  }
};

// Calculate slider marker positions
export const getSliderMarkers = (game: Game) => {
  if (game.id === 'wordle' || game.id === 'framed' || game.id === 'worldle' || game.id === 'sqnces-6' || game.id === 'sqnces-7' || game.id === 'sqnces-8') {
    // For Wordle, Framed, Worldle, SQNCES with fixed positions (1-7, where 7 is a loss)
    return [1, 2, 3, 4, 5, 6, 7];
  } else if (game.id === 'connections') {
    // For Connections with range 4-8
    return [4, 5, 6, 7, 8];
  } else if (game.id === 'betweenle') {
    // For Betweenle with range 0-5
    return [0, 1, 2, 3, 4, 5];
  } else if (game.id === 'nerdle') {
    // For Nerdle with range 1-7
    return [1, 2, 3, 4, 5, 6, 7];
  } else if (game.id === 'spelling-bee') {
    // For Spelling Bee with range 0-137
    return [0, 35, 70, 105, 137];
  } else if (game.id === 'mini-crossword') {
    // For Mini Crossword with range 0-300
    return [0, 60, 120, 180, 240, 300];
  } else if (game.id === 'tightrope') {
    // For Tightrope with range 0-2340
    return [0, 585, 1170, 1755, 2340];
  } else if (game.id === 'squardle') {
    // For Squardle with range 0-10
    return [0, 2, 4, 6, 8, 10];
  } else if (game.id === 'minute-cryptic') {
    // For Minute Cryptic with range -3 to +10
    return [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  } else if (game.id === 'waffle') {
    return [0, 3, 6, 9, 12, 15];
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
         game.id === 'nerdle' ? 4 : // Default to middle value for Nerdle
         game.id === 'spelling-bee' ? 68 : // Default to middle value for Spelling Bee (approx 137/2)
         game.id === 'mini-crossword' ? 120 : // Default to 2 minutes for Mini Crossword
         game.id === 'tightrope' ? 1170 : // Default to middle value for Tightrope (2340/2)
         game.id === 'squardle' ? 5 : // Default to middle value for Squardle (0-10)
         game.id === 'minute-cryptic' ? 0 : // Default to par (0) for Minute Cryptic
         game.id === 'waffle' ? 8 : // Default to middle value for Waffle (0-15)
         game.id === 'sqnces-6' || game.id === 'sqnces-7' || game.id === 'sqnces-8' ? 4 : // Default for SQNCES variations
         Math.floor((game.maxScore || 100) / 2);
};
