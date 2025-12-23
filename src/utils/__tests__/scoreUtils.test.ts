import { describe, it, expect } from 'vitest';
import { getScoreLabel, getScoreColor, getSliderMarkers, calculateQuordleScore, getDefaultValue } from '../scoreUtils';
import { games } from '../gameData';

describe('scoreUtils', () => {
  describe('getScoreLabel', () => {
    const wordleGame = games.find(g => g.id === 'wordle')!;
    const spellingBeeGame = games.find(g => g.id === 'spelling-bee')!;
    const connectionsGame = games.find(g => g.id === 'connections')!;
    const miniCrosswordGame = games.find(g => g.id === 'mini-crossword')!;
    const quordleGame = games.find(g => g.id === 'quordle')!;
    const minuteCrypticGame = games.find(g => g.id === 'minute-cryptic')!;
    const betweenleGame = games.find(g => g.id === 'betweenle')!;
    const strandsGame = games.find(g => g.id === 'strands')!;

    it('should return correct labels for Wordle scores', () => {
      expect(getScoreLabel(3, wordleGame)).toBe('Excellent');
      expect(getScoreLabel(4, wordleGame)).toBe('Good');
      expect(getScoreLabel(6, wordleGame)).toBe('Fair');
      expect(getScoreLabel(7, wordleGame)).toBe('Loss');
    });

    it('should return correct labels for Spelling Bee scores', () => {
      expect(getScoreLabel(100, spellingBeeGame)).toBe('Excellent');
      expect(getScoreLabel(60, spellingBeeGame)).toBe('Good');
      expect(getScoreLabel(30, spellingBeeGame)).toBe('Fair');
    });

    it('should return correct labels for Connections scores', () => {
      expect(getScoreLabel(4, connectionsGame)).toBe('Excellent');
      expect(getScoreLabel(5, connectionsGame)).toBe('Excellent');
      expect(getScoreLabel(6, connectionsGame)).toBe('Good');
      expect(getScoreLabel(7, connectionsGame)).toBe('Good');
      expect(getScoreLabel(8, connectionsGame)).toBe('Loss');
    });

    it('should return correct labels for Mini Crossword (lower is better)', () => {
      expect(getScoreLabel(60, miniCrosswordGame)).toBe('Excellent');
      expect(getScoreLabel(120, miniCrosswordGame)).toBe('Good');
      expect(getScoreLabel(200, miniCrosswordGame)).toBe('Fair');
    });

    it('should return correct labels for Quordle with quordleValues', () => {
      // Total score 15 - Excellent
      expect(getScoreLabel(15, quordleGame, [3, 4, 4, 4])).toBe('Excellent');
      // Total score 20 - Good
      expect(getScoreLabel(20, quordleGame, [5, 5, 5, 5])).toBe('Good');
      // Total score 30 - Fair
      expect(getScoreLabel(30, quordleGame, [7, 8, 8, 7])).toBe('Fair');
      // All X's - Loss
      expect(getScoreLabel(40, quordleGame, [10, 10, 10, 10])).toBe('Loss');
    });

    it('should return correct labels for Minute Cryptic (golf scoring)', () => {
      expect(getScoreLabel(-3, minuteCrypticGame)).toBe('Excellent');
      expect(getScoreLabel(-1, minuteCrypticGame)).toBe('Good');
      expect(getScoreLabel(1, minuteCrypticGame)).toBe('Fair');
      expect(getScoreLabel(5, minuteCrypticGame)).toBe('Poor');
    });

    it('should return correct labels for Betweenle (higher is better)', () => {
      expect(getScoreLabel(5, betweenleGame)).toBe('Excellent');
      expect(getScoreLabel(3, betweenleGame)).toBe('Good');
      expect(getScoreLabel(1, betweenleGame)).toBe('Fair');
      expect(getScoreLabel(0, betweenleGame)).toBe('Loss');
    });

    it('should return correct labels for Strands', () => {
      expect(getScoreLabel(1, strandsGame)).toBe('Excellent');
      expect(getScoreLabel(4, strandsGame)).toBe('Good');
      expect(getScoreLabel(7, strandsGame)).toBe('Fair');
      expect(getScoreLabel(9, strandsGame)).toBe('Poor');
    });

    it('should handle threshold boundaries correctly', () => {
      // Test exact threshold values for Wordle
      expect(getScoreLabel(3, wordleGame)).toBe('Excellent'); // At upper bound
      expect(getScoreLabel(4, wordleGame)).toBe('Good'); // Just above excellent
      expect(getScoreLabel(5, wordleGame)).toBe('Good'); // At upper bound of good
      expect(getScoreLabel(6, wordleGame)).toBe('Fair'); // Just below good
    });

    it('should return N/A for undefined game', () => {
      expect(getScoreLabel(3)).toBe('N/A');
    });

    it('should handle null game gracefully', () => {
      expect(getScoreLabel(3, undefined)).toBe('N/A');
    });

    it('should use percentage calculation for generic games', () => {
      const genericGame = { id: 'custom-game', maxScore: 100 } as any;
      expect(getScoreLabel(90, genericGame)).toBe('Excellent'); // 90% >= 80
      expect(getScoreLabel(70, genericGame)).toBe('Good'); // 70% >= 60
      expect(getScoreLabel(50, genericGame)).toBe('Fair'); // 50% < 60
    });
  });

  describe('getScoreColor', () => {
    const wordleGame = games.find(g => g.id === 'wordle')!;
    const connectionsGame = games.find(g => g.id === 'connections')!;
    const betweenleGame = games.find(g => g.id === 'betweenle')!;
    const miniCrosswordGame = games.find(g => g.id === 'mini-crossword')!;
    const quordleGame = games.find(g => g.id === 'quordle')!;
    const minuteCrypticGame = games.find(g => g.id === 'minute-cryptic')!;
    const strandsGame = games.find(g => g.id === 'strands')!;

    it('should return correct colors for Wordle scores', () => {
      expect(getScoreColor(3, wordleGame)).toBe('text-emerald-500');
      expect(getScoreColor(4, wordleGame)).toBe('text-amber-500');
      expect(getScoreColor(6, wordleGame)).toBe('text-rose-500');
      expect(getScoreColor(7, wordleGame)).toBe('text-gray-500');
    });

    it('should return correct colors for Connections', () => {
      expect(getScoreColor(5, connectionsGame)).toBe('text-emerald-500');
      expect(getScoreColor(6, connectionsGame)).toBe('text-amber-500');
      expect(getScoreColor(8, connectionsGame)).toBe('text-gray-500'); // Loss
    });

    it('should return correct colors for Betweenle (higher is better)', () => {
      expect(getScoreColor(4, betweenleGame)).toBe('text-emerald-500');
      expect(getScoreColor(2, betweenleGame)).toBe('text-amber-500');
      expect(getScoreColor(1, betweenleGame)).toBe('text-rose-500');
    });

    it('should return correct colors for Mini Crossword (lower is better)', () => {
      expect(getScoreColor(60, miniCrosswordGame)).toBe('text-emerald-500');
      expect(getScoreColor(120, miniCrosswordGame)).toBe('text-amber-500');
      expect(getScoreColor(240, miniCrosswordGame)).toBe('text-rose-500');
    });

    it('should return correct colors for Quordle with quordleValues', () => {
      // Excellent - green
      expect(getScoreColor(15, quordleGame, [3, 4, 4, 4])).toBe('text-emerald-500');
      // Good - amber
      expect(getScoreColor(20, quordleGame, [5, 5, 5, 5])).toBe('text-amber-500');
      // Fair - rose
      expect(getScoreColor(30, quordleGame, [7, 8, 8, 7])).toBe('text-rose-500');
      // All X's - gray (loss)
      expect(getScoreColor(40, quordleGame, [10, 10, 10, 10])).toBe('text-gray-500');
    });

    it('should return emerald for all Minute Cryptic thresholds', () => {
      // All thresholds return emerald in the implementation
      expect(getScoreColor(-3, minuteCrypticGame)).toBe('text-emerald-500');
      expect(getScoreColor(-1, minuteCrypticGame)).toBe('text-emerald-500');
      expect(getScoreColor(1, minuteCrypticGame)).toBe('text-emerald-500');
      expect(getScoreColor(5, minuteCrypticGame)).toBe('text-rose-500');
    });

    it('should return correct colors for Strands', () => {
      expect(getScoreColor(1, strandsGame)).toBe('text-emerald-500');
      expect(getScoreColor(4, strandsGame)).toBe('text-amber-500');
      expect(getScoreColor(7, strandsGame)).toBe('text-rose-500');
    });

    it('should handle threshold boundaries for color', () => {
      // Test exact threshold values
      expect(getScoreColor(3, wordleGame)).toBe('text-emerald-500'); // At upper bound
      expect(getScoreColor(4, wordleGame)).toBe('text-amber-500'); // Crosses threshold
      expect(getScoreColor(5, wordleGame)).toBe('text-amber-500'); // At upper bound
      expect(getScoreColor(6, wordleGame)).toBe('text-rose-500'); // Crosses threshold
    });

    it('should return gray for undefined game', () => {
      expect(getScoreColor(3)).toBe('text-gray-500');
    });

    it('should handle null game gracefully', () => {
      expect(getScoreColor(3, undefined)).toBe('text-gray-500');
    });

    it('should use percentage calculation for generic games', () => {
      const genericGame = { id: 'custom-game', maxScore: 100 } as any;
      expect(getScoreColor(90, genericGame)).toBe('text-emerald-500'); // 90% >= 80
      expect(getScoreColor(70, genericGame)).toBe('text-amber-500'); // 70% >= 60
      expect(getScoreColor(50, genericGame)).toBe('text-rose-500'); // 50% < 60
    });
  });

  describe('getSliderMarkers', () => {
    const wordleGame = games.find(g => g.id === 'wordle')!;
    const connectionsGame = games.find(g => g.id === 'connections')!;
    const betweenleGame = games.find(g => g.id === 'betweenle')!;
    const spellingBeeGame = games.find(g => g.id === 'spelling-bee')!;
    const miniCrosswordGame = games.find(g => g.id === 'mini-crossword')!;
    const minuteCrypticGame = games.find(g => g.id === 'minute-cryptic')!;
    const waffleGame = games.find(g => g.id === 'waffle')!;
    const strandsGame = games.find(g => g.id === 'strands')!;

    it('should return correct markers for Wordle', () => {
      const markers = getSliderMarkers(wordleGame);
      expect(markers).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should return correct markers for Connections', () => {
      const markers = getSliderMarkers(connectionsGame);
      expect(markers).toEqual([4, 5, 6, 7, 8]);
    });

    it('should return correct markers for Betweenle', () => {
      const markers = getSliderMarkers(betweenleGame);
      expect(markers).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should return correct markers for Spelling Bee', () => {
      const markers = getSliderMarkers(spellingBeeGame);
      expect(markers).toEqual([0, 35, 70, 105, 137]);
    });

    it('should return correct markers for Mini Crossword', () => {
      const markers = getSliderMarkers(miniCrosswordGame);
      expect(markers).toEqual([0, 100, 200, 300, 400, 500, 600]);
    });

    it('should return correct markers for Minute Cryptic', () => {
      const markers = getSliderMarkers(minuteCrypticGame);
      expect(markers).toEqual([-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should return correct markers for Waffle', () => {
      const markers = getSliderMarkers(waffleGame);
      expect(markers).toEqual([0, 2, 4, 6]);
    });

    it('should return correct markers for Strands', () => {
      const markers = getSliderMarkers(strandsGame);
      expect(markers).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should calculate markers for games with custom maxScore', () => {
      const tightropeGame = games.find(g => g.id === 'tightrope')!;
      const markers = getSliderMarkers(tightropeGame);

      // Should have 5 markers evenly spaced based on maxScore
      expect(markers).toHaveLength(5);
      expect(markers[0]).toBe(0);
      expect(markers[markers.length - 1]).toBe(tightropeGame.maxScore);
    });

    it('should handle generic games with default maxScore', () => {
      const genericGame = { id: 'custom-game', maxScore: 100 } as any;
      const markers = getSliderMarkers(genericGame);

      // Should create 5 evenly spaced markers from 0 to maxScore
      expect(markers).toHaveLength(5);
      expect(markers[0]).toBe(0);
      expect(markers[4]).toBe(100);
      expect(markers[2]).toBe(50); // Middle value
    });

    it('should handle games with no maxScore by using fallback', () => {
      const gameWithoutMax = { id: 'test-game' } as any;
      const markers = getSliderMarkers(gameWithoutMax);

      // Should use default 100 and create 5 markers
      expect(markers).toHaveLength(5);
      expect(markers[0]).toBe(0);
      expect(markers[4]).toBe(100);
    });

    it('should round marker values for games with calculated steps', () => {
      const customGame = { id: 'custom', maxScore: 99 } as any;
      const markers = getSliderMarkers(customGame);

      // All markers should be whole numbers
      markers.forEach(marker => {
        expect(Number.isInteger(marker)).toBe(true);
      });
    });
  });

  describe('calculateQuordleScore', () => {
    it('should calculate total score correctly', () => {
      const values = [3, 4, 5, 6];
      expect(calculateQuordleScore(values)).toBe(18);
    });

    it('should handle X (10) values correctly', () => {
      const values = [3, 10, 5, 6]; // One X
      expect(calculateQuordleScore(values)).toBe(24);
    });

    it('should handle all X values', () => {
      const values = [10, 10, 10, 10];
      expect(calculateQuordleScore(values)).toBe(40);
    });

    it('should handle mixed X and regular values', () => {
      const values = [3, 10, 10, 4];
      expect(calculateQuordleScore(values)).toBe(27);
    });

    it('should handle empty array', () => {
      const values: number[] = [];
      expect(calculateQuordleScore(values)).toBe(0);
    });

    it('should handle minimum scores', () => {
      const values = [1, 1, 1, 1];
      expect(calculateQuordleScore(values)).toBe(4);
    });
  });

  describe('getDefaultValue', () => {
    const wordleGame = games.find(g => g.id === 'wordle')!;
    const framedGame = games.find(g => g.id === 'framed')!;
    const spellingBeeGame = games.find(g => g.id === 'spelling-bee')!;
    const connectionsGame = games.find(g => g.id === 'connections')!;
    const betweenleGame = games.find(g => g.id === 'betweenle')!;
    const nerdleGame = games.find(g => g.id === 'nerdle')!;
    const miniCrosswordGame = games.find(g => g.id === 'mini-crossword')!;
    const squardleGame = games.find(g => g.id === 'squardle')!;
    const minuteCrypticGame = games.find(g => g.id === 'minute-cryptic')!;
    const waffleGame = games.find(g => g.id === 'waffle')!;

    it('should return correct default for Wordle', () => {
      expect(getDefaultValue(wordleGame)).toBe(3);
    });

    it('should return correct default for Framed', () => {
      expect(getDefaultValue(framedGame)).toBe(3);
    });

    it('should return correct default for Spelling Bee', () => {
      expect(getDefaultValue(spellingBeeGame)).toBe(68);
    });

    it('should return correct default for Connections', () => {
      expect(getDefaultValue(connectionsGame)).toBe(6);
    });

    it('should return correct default for Betweenle', () => {
      expect(getDefaultValue(betweenleGame)).toBe(3);
    });

    it('should return correct default for Nerdle', () => {
      expect(getDefaultValue(nerdleGame)).toBe(4);
    });

    it('should return correct default for Mini Crossword', () => {
      expect(getDefaultValue(miniCrosswordGame)).toBe(120);
    });

    it('should return correct default for Squardle', () => {
      expect(getDefaultValue(squardleGame)).toBe(5);
    });

    it('should return correct default for Minute Cryptic (par)', () => {
      expect(getDefaultValue(minuteCrypticGame)).toBe(0);
    });

    it('should return correct default for Waffle', () => {
      expect(getDefaultValue(waffleGame)).toBe(3);
    });

    it('should handle SQNCES variations', () => {
      const sqnces6 = games.find(g => g.id === 'sqnces-6')!;
      const sqnces7 = games.find(g => g.id === 'sqnces-7')!;
      const sqnces8 = games.find(g => g.id === 'sqnces-8')!;

      expect(getDefaultValue(sqnces6)).toBe(4);
      expect(getDefaultValue(sqnces7)).toBe(4);
      expect(getDefaultValue(sqnces8)).toBe(4);
    });

    it('should calculate default for Tightrope based on maxScore', () => {
      const tightropeGame = games.find(g => g.id === 'tightrope')!;
      const defaultValue = getDefaultValue(tightropeGame);

      expect(defaultValue).toBe(Math.round((tightropeGame.maxScore || 2600) / 2));
    });

    it('should return calculated default for generic games', () => {
      const genericGame = { id: 'test', maxScore: 100 } as any;
      expect(getDefaultValue(genericGame)).toBe(50);
    });

    it('should handle games without maxScore', () => {
      const gameWithoutMax = { id: 'test-game' } as any;
      expect(getDefaultValue(gameWithoutMax)).toBe(50); // Uses fallback 100 / 2
    });

    it('should handle games with odd maxScore values', () => {
      const oddMaxGame = { id: 'odd-game', maxScore: 99 } as any;
      expect(getDefaultValue(oddMaxGame)).toBe(49); // Floor of 99/2
    });

    it('should return whole numbers for calculated defaults', () => {
      const games = [
        { id: 'test1', maxScore: 101 },
        { id: 'test2', maxScore: 999 },
        { id: 'test3', maxScore: 57 },
      ];

      games.forEach(game => {
        const defaultValue = getDefaultValue(game as any);
        expect(Number.isInteger(defaultValue)).toBe(true);
      });
    });
  });
});