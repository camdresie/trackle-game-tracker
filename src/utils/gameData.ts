
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
