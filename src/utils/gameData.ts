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
    maxScore: 600,
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
    externalUrl: 'https://www.minutecryptic.com/',
    isNew: true
  },
  {
    id: 'worldle',
    name: 'Worldle',
    description: 'Guess the country based on its shape in 6 tries or less.',
    icon: 'map', // Using 'map' icon for now
    color: 'bg-sky-500', 
    maxScore: 7, // 1-6 is a win, 7 is a loss
    externalUrl: 'https://worldle.teuteuf.fr/',
    isNew: true
  },
  {
    id: 'waffle',
    name: 'Waffle',
    description: 'Rearrange letters into correct words in 15 moves or fewer.',
    icon: 'grip-vertical', // Using 'grip-vertical' icon for now
    color: 'bg-orange-400', 
    maxScore: 15, // Max swaps remaining
    externalUrl: 'https://wafflegame.net/daily',
    isNew: true
  },
  {
    id: 'sqnces-6',
    name: 'SQNCES (6-Letter)',
    description: 'Use a 3-letter sequence to find the 6-letter word.',
    icon: 'align-horizontal-justify-center', 
    color: 'bg-purple-600',
    maxScore: 7,
    externalUrl: 'https://sqnces.com/',
    isNew: true
  },
  {
    id: 'sqnces-7',
    name: 'SQNCES (7-Letter)',
    description: 'Use a 3-letter sequence to find the 7-letter word.',
    icon: 'align-horizontal-justify-center',
    color: 'bg-purple-700', // Slightly different color
    maxScore: 7,
    externalUrl: 'https://sqnces.com/',
    isNew: true
  },
  {
    id: 'sqnces-8',
    name: 'SQNCES (8-Letter)',
    description: 'Use a 3-letter sequence to find the 8-letter word.',
    icon: 'align-horizontal-justify-center',
    color: 'bg-purple-800', // Slightly different color
    maxScore: 7,
    externalUrl: 'https://sqnces.com/',
    isNew: true
  },
  {
    id: 'strands',
    name: 'Strands',
    description: 'Find themed words in a grid. Score is the number of hints used.',
    icon: 'search', // Placeholder icon, update if needed
    color: 'bg-teal-500', // Placeholder color
    maxScore: 10, // 0 is best, 10 is worst (most hints)
    externalUrl: 'https://www.nytimes.com/games/strands', // Confirm URL if different
    isNew: true,
    lowerIsBetter: true, // Explicitly define this property
    scoreUnit: 'hints' // Explicitly define the score unit
  }
];

// Get a game by ID
export const getGameById = (gameId: string, gamesList = games) => {
  return gamesList.find(game => game.id === gameId) || null;
};

// Calculate the best score for a player in a specific game
export const calculateBestScore = (scores: any[], game: any) => {
  if (!scores || scores.length === 0) return null;
  
  // Use the lowerIsBetter flag from the game definition
  if (game.lowerIsBetter) {
    // Filter out invalid scores based on game rules if necessary
    // For Strands, 0-10 are all valid, so we might not need complex filtering initially
    // We still might want to exclude non-numeric or null values
    const validScores = scores.filter(score => typeof score.value === 'number');

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
  // Get the game object first
  const game = getGameById(gameId);
  
  // Use the scoreUnit if defined, otherwise fallback to switch statement
  if (game?.scoreUnit) {
    return game.scoreUnit;
  }

  switch (gameId) {
    case 'wordle':
    case 'framed':
    case 'connections':
    case 'nerdle':
    case 'quordle':
    case 'worldle':
    case 'sqnces-6':
    case 'sqnces-7':
    case 'sqnces-8':
      return 'tries';
    case 'mini-crossword':
      return 'seconds';
    case 'betweenle':
    case 'spelling-bee':
    case 'tightrope':
    case 'squardle':
      return 'points';
    case 'minute-cryptic':
      return 'hints';
    case 'waffle':
      return 'swaps';
    default:
      return 'points'; // Default label
  }
};

// Determine if a game treats lower scores as better
export const isLowerScoreBetter = (gameId: string): boolean => {
  // Get the game object first
  const game = getGameById(gameId);
  // Return the lowerIsBetter flag if defined, otherwise fallback to list check
  return game?.lowerIsBetter ?? ['wordle', 'framed', 'mini-crossword', 'nerdle', 'connections', 'minute-cryptic', 'quordle', 'worldle', 'sqnces-6', 'sqnces-7', 'sqnces-8'].includes(gameId);
};
