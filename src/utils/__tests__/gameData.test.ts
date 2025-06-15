import { describe, it, expect } from 'vitest';
import { 
  getGameById, 
  calculateBestScore, 
  calculateAverageScore, 
  getLabelByGame, 
  isLowerScoreBetter,
  games
} from '../gameData';

describe('gameData utilities', () => {
  describe('getGameById', () => {
    it('should return the correct game when found', () => {
      const game = getGameById('wordle');
      expect(game).toBeDefined();
      expect(game?.id).toBe('wordle');
      expect(game?.name).toBe('Wordle');
    });

    it('should return null for non-existent game', () => {
      const game = getGameById('non-existent-game');
      expect(game).toBeNull();
    });
  });

  describe('calculateBestScore', () => {
    const mockScores = [
      { value: 3 },
      { value: 4 },
      { value: 2 },
      { value: 5 }
    ];

    it('should return the lowest score for lower-is-better games', () => {
      const wordleGame = { lowerIsBetter: true };
      const bestScore = calculateBestScore(mockScores, wordleGame);
      expect(bestScore).toBe(2);
    });

    it('should return the highest score for higher-is-better games', () => {
      const spellingBeeGame = { lowerIsBetter: false };
      const bestScore = calculateBestScore(mockScores, spellingBeeGame);
      expect(bestScore).toBe(5);
    });

    it('should return null for empty scores array', () => {
      const wordleGame = { lowerIsBetter: true };
      const bestScore = calculateBestScore([], wordleGame);
      expect(bestScore).toBeNull();
    });

    it('should filter out non-numeric scores for lower-is-better games', () => {
      const mixedScores = [
        { value: 3 },
        { value: null },
        { value: 2 },
        { value: undefined }
      ];
      const wordleGame = { lowerIsBetter: true };
      const bestScore = calculateBestScore(mixedScores, wordleGame);
      expect(bestScore).toBe(2);
    });

    // Tests for the Mini Crossword scoring fix
    describe('Mini Crossword scoring', () => {
      it('should return the fastest time (lowest score) for Mini Crossword', () => {
        const miniCrosswordGame = getGameById('mini-crossword');
        const timeScores = [
          { value: 120 }, // 2 minutes
          { value: 90 },  // 1.5 minutes
          { value: 150 }, // 2.5 minutes
          { value: 75 }   // 1.25 minutes (best)
        ];
        
        const bestScore = calculateBestScore(timeScores, miniCrosswordGame);
        expect(bestScore).toBe(75); // Should be the fastest time
      });

      it('should have lowerIsBetter flag set to true for Mini Crossword', () => {
        const miniCrosswordGame = getGameById('mini-crossword');
        expect(miniCrosswordGame?.lowerIsBetter).toBe(true);
      });
    });

    // Tests for other time-based games
    describe('Time-based games scoring', () => {
      const timeBasedGames = ['wordle', 'framed', 'connections', 'nerdle', 'quordle', 'minute-cryptic', 'worldle', 'sqnces-6', 'sqnces-7', 'sqnces-8', 'strands'];
      
      timeBasedGames.forEach(gameId => {
        it(`should have lowerIsBetter flag set to true for ${gameId}`, () => {
          const game = getGameById(gameId);
          expect(game?.lowerIsBetter).toBe(true);
        });
      });

      it('should return the lowest score for all time-based games', () => {
        const attemptScores = [{ value: 6 }, { value: 3 }, { value: 4 }, { value: 2 }];
        
        timeBasedGames.forEach(gameId => {
          const game = getGameById(gameId);
          if (game) {
            const bestScore = calculateBestScore(attemptScores, game);
            expect(bestScore).toBe(2); // Should always be the lowest
          }
        });
      });
    });

    // Tests for score-based games
    describe('Score-based games scoring', () => {
      const scoreBasedGames = ['betweenle', 'spelling-bee', 'tightrope', 'squardle', 'waffle'];
      
      scoreBasedGames.forEach(gameId => {
        it(`should not have lowerIsBetter flag or have it set to false for ${gameId}`, () => {
          const game = getGameById(gameId);
          expect(game?.lowerIsBetter).toBeFalsy();
        });
      });

      it('should return the highest score for score-based games', () => {
        const pointScores = [{ value: 10 }, { value: 25 }, { value: 15 }, { value: 30 }];
        
        scoreBasedGames.forEach(gameId => {
          const game = getGameById(gameId);
          if (game) {
            const bestScore = calculateBestScore(pointScores, game);
            expect(bestScore).toBe(30); // Should always be the highest
          }
        });
      });
    });
  });

  describe('calculateAverageScore', () => {
    it('should calculate correct average', () => {
      const scores = [{ value: 2 }, { value: 4 }, { value: 6 }];
      const average = calculateAverageScore(scores);
      expect(average).toBe(4);
    });

    it('should return null for empty array', () => {
      const average = calculateAverageScore([]);
      expect(average).toBeNull();
    });
  });

  describe('getLabelByGame', () => {
    it('should return correct labels for different games', () => {
      expect(getLabelByGame('wordle')).toBe('tries');
      expect(getLabelByGame('mini-crossword')).toBe('seconds');
      expect(getLabelByGame('spelling-bee')).toBe('points');
      expect(getLabelByGame('strands')).toBe('hints');
    });

    it('should return default label for unknown game', () => {
      expect(getLabelByGame('unknown-game')).toBe('points');
    });
  });

  describe('isLowerScoreBetter', () => {
    it('should return true for lower-is-better games', () => {
      expect(isLowerScoreBetter('wordle')).toBe(true);
      expect(isLowerScoreBetter('mini-crossword')).toBe(true);
      expect(isLowerScoreBetter('connections')).toBe(true);
    });

    it('should return false for higher-is-better games', () => {
      expect(isLowerScoreBetter('spelling-bee')).toBe(false);
      expect(isLowerScoreBetter('betweenle')).toBe(false);
    });

    it('should use game definition lowerIsBetter flag when available', () => {
      const strandsGame = getGameById('strands');
      expect(strandsGame?.lowerIsBetter).toBe(true);
      expect(isLowerScoreBetter('strands')).toBe(true);
    });
  });

  describe('games array', () => {
    it('should have unique game IDs', () => {
      const gameIds = games.map(game => game.id);
      const uniqueIds = [...new Set(gameIds)];
      expect(gameIds.length).toBe(uniqueIds.length);
    });

    it('should have required properties for each game', () => {
      games.forEach(game => {
        expect(game).toHaveProperty('id');
        expect(game).toHaveProperty('name');
        expect(game).toHaveProperty('description');
        expect(game).toHaveProperty('icon');
        expect(game).toHaveProperty('color');
        expect(game).toHaveProperty('maxScore');
        expect(game).toHaveProperty('externalUrl');
        
        expect(typeof game.id).toBe('string');
        expect(typeof game.name).toBe('string');
        expect(typeof game.description).toBe('string');
        expect(typeof game.maxScore).toBe('number');
        expect(game.maxScore).toBeGreaterThan(0);
      });
    });
  });
});