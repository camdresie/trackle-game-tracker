import { describe, it, expect } from 'vitest';
import { getScoreLabel, getScoreColor, getSliderMarkers, calculateQuordleScore, getDefaultValue } from '../scoreUtils';
import { games } from '../gameData';

describe('scoreUtils', () => {
  describe('getScoreLabel', () => {
    const wordleGame = games.find(g => g.id === 'wordle')!;
    const spellingBeeGame = games.find(g => g.id === 'spelling-bee')!;

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

    it('should return N/A for undefined game', () => {
      expect(getScoreLabel(3)).toBe('N/A');
    });
  });

  describe('getScoreColor', () => {
    const wordleGame = games.find(g => g.id === 'wordle')!;

    it('should return correct colors for Wordle scores', () => {
      expect(getScoreColor(3, wordleGame)).toBe('text-emerald-500');
      expect(getScoreColor(4, wordleGame)).toBe('text-amber-500');
      expect(getScoreColor(6, wordleGame)).toBe('text-rose-500');
      expect(getScoreColor(7, wordleGame)).toBe('text-gray-500');
    });

    it('should return gray for undefined game', () => {
      expect(getScoreColor(3)).toBe('text-gray-500');
    });
  });

  describe('getSliderMarkers', () => {
    const wordleGame = games.find(g => g.id === 'wordle')!;
    const connectionsGame = games.find(g => g.id === 'connections')!;

    it('should return correct markers for Wordle', () => {
      const markers = getSliderMarkers(wordleGame);
      expect(markers).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should return correct markers for Connections', () => {
      const markers = getSliderMarkers(connectionsGame);
      expect(markers).toEqual([4, 5, 6, 7, 8]);
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
  });

  describe('getDefaultValue', () => {
    const wordleGame = games.find(g => g.id === 'wordle')!;
    const spellingBeeGame = games.find(g => g.id === 'spelling-bee')!;

    it('should return correct default for Wordle', () => {
      expect(getDefaultValue(wordleGame)).toBe(3);
    });

    it('should return correct default for Spelling Bee', () => {
      expect(getDefaultValue(spellingBeeGame)).toBe(68);
    });

    it('should return calculated default for generic games', () => {
      const genericGame = { id: 'test', maxScore: 100 } as any;
      expect(getDefaultValue(genericGame)).toBe(50);
    });
  });
});