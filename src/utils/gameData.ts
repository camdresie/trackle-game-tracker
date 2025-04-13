// Game data and utility functions

// List of all games in the application
export const games = [
  {
    id: 'wordle',
    name: 'Wordle',
    description: 'Guess the 5-letter word in 6 tries or less.',
    icon: 'puzzle',
    color: 'bg-emerald-500',
    maxScore: 7, // Updated to 7 to account for loss
    externalUrl: 'https://www.nytimes.com/games/wordle/'
  },
  {
    id: 'mini-crossword',
    name: 'Mini Crossword',
    description: 'Solve the crossword puzzle as quickly as possible.',
    icon: 'grid',
    color: 'bg-rose-500',
    maxScore: 300,
    externalUrl: 'https://www.nytimes.com/crosswords/game/mini'
  },
  {
    id: 'connections',
    name: 'Connections',
    description: 'Find groups of related words.',
    icon: 'layout-grid',
    color: 'bg-yellow-500',
    maxScore: 8,
    externalUrl: 'https://www.nytimes.com/games/connections'
  },
  {
    id: 'framed',
    name: 'Framed',
    description: 'Guess the movie from visual clues.',
    icon: 'film',
    color: 'bg-blue-500',
    maxScore: 7,
    externalUrl: 'https://framed.wtf/'
  },
  {
    id: 'quordle',
    name: 'Quordle',
    description: 'Solve four Wordle-like puzzles simultaneously.',
    icon: 'grid',
    color: 'bg-purple-500',
    maxScore: 40,
    externalUrl: 'https://www.merriam-webster.com/games/quordle/#/'
  },
  {
    id: 'betweenle',
    name: 'Betweenle',
    description: 'Find the word between two other words.',
    icon: 'link',
    color: 'bg-cyan-500',
    maxScore: 5,
    externalUrl: 'https://betweenle.com/'
  },
  {
    id: 'spelling-bee',
    name: 'Spelling Bee',
    description: 'Make words using the given letters.',
    icon: 'bee',
    color: 'bg-amber-500',
    maxScore: 137,
    externalUrl: 'https://www.nytimes.com/puzzles/spelling-bee'
  },
  {
    id: 'tightrope',
    name: 'Tightrope',
    description: 'Balance your path across the tightrope by answering trivia questions.',
    icon: 'link',
    color: 'bg-blue-400',
    maxScore: 2340,
    externalUrl: 'https://www.britannica.com/quiz/tightrope'
  },
  {
    id: 'nerdle',
    name: 'Nerdle',
    description: 'Guess the equation in 6 tries.',
    icon: 'calculator',
    color: 'bg-green-600',
    maxScore: 7,
    externalUrl: 'https://nerdlegame.com/'
  },
  {
    id: 'squardle',
    name: 'Squardle',
    description: 'Find words in a square grid.',
    icon: 'square',
    color: 'bg-orange-500',
    maxScore: 10,
    externalUrl: 'https://fubargames.se/squardle/'
  },
  {
    id: 'minute-cryptic',
    name: 'Minute Cryptic',
    description: 'Solve a daily cryptic clue. Score based on hints needed - par is based on hints needed.',
    icon: 'timer',
    color: 'bg-indigo-500',
    maxScore: 13, // Range from -3 to +10, so total range is 13
    externalUrl: 'https://www.minutecryptic.com/'
  }
];

// Get a game by ID
export const getGameById = (gameId: string, gamesList = games) => {
  return gamesList.find(game => game.id === gameId) || null;
};

// Calculate the best score for a player in a specific game
export const calculateBestScore = (scores: any[], game: any) => {
  if (!scores || scores.length === 0) return null;
  
  // For these games, lower scores are better
  if (['wordle', 'framed', 'mini-crossword', 'nerdle', 'connections', 'minute-cryptic', 'quordle'].includes(game.id)) {
    // Filter out invalid scores:
    // - Zeros/negatives for games where 0 is not valid (all except minute-cryptic).
    // - Specific loss scores (e.g., 7 for Wordle/Framed).
    const validScores = scores.filter(score => {
      if (typeof score.value !== 'number') return false; // Ensure it's a number

      // Base validity: Allow non-positive for minute-cryptic, require > 0 otherwise
      const baseCheck = (game.id === 'minute-cryptic') ? true : score.value > 0;

      // Exclude specific loss scores
      const wordleFramedLossCheck = (['wordle', 'framed'].includes(game.id)) ? score.value < 7 : true;
      const quordleLossCheck = (game.id === 'quordle') ? score.value < 40 : true;

      return baseCheck && wordleFramedLossCheck && quordleLossCheck;
    });

    if (validScores.length === 0) return null;
    return Math.min(...validScores.map(score => score.value));
  } else {
    // For other games (including betweenle), higher scores are better
    return Math.max(...scores.map(score => score.value));
  }
};

// Calculate the average score for a player in a specific game
export const calculateAverageScore = (scores: any[]) => {
  if (!scores || scores.length === 0) return null;
  
  const sum = scores.reduce((total, score) => total + score.value, 0);
  return sum / scores.length;
};

// Update getLabelByGame to handle game-specific labels correctly
export const getLabelByGame = (gameId: string): string => {
  switch (gameId) {
    case 'wordle':
    case 'framed':
    case 'connections':
    case 'nerdle':
    case 'quordle':
      return 'tries';
    case 'mini-crossword':
      return 'seconds';
    case 'betweenle':
    case 'spelling-bee':
    case 'tightrope':
    case 'squardle':
      return 'points';
    default:
      return 'points';
  }
};

// Determine if a game treats lower scores as better
export const isLowerScoreBetter = (gameId: string): boolean => {
  return ['wordle', 'framed', 'mini-crossword', 'nerdle', 'connections', 'minute-cryptic', 'quordle'].includes(gameId);
};
