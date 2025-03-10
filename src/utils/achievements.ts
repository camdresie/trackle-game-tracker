
import { Game, Score, Achievement } from './types';
import { getScoresByGameAndPlayer, getScoresByPlayerId, games } from './gameData';

// General achievements
export const generalAchievements: Achievement[] = [
  {
    id: 'first-play',
    title: 'First Steps',
    description: 'Play your first game',
    icon: 'flag',
    criteria: (scores: Score[]) => scores.length > 0,
    category: 'general'
  },
  {
    id: 'all-games',
    title: 'Game Master',
    description: 'Play all available games',
    icon: 'crown',
    criteria: (scores: Score[]) => {
      const uniqueGames = new Set(scores.map(score => score.gameId));
      return uniqueGames.size >= games.length;
    },
    category: 'general'
  },
  {
    id: 'daily-player',
    title: 'Daily Devotion',
    description: 'Play games for 7 consecutive days',
    icon: 'calendar',
    criteria: (scores: Score[]) => {
      // Implementation would track date sequences
      return false; // Placeholder - real implementation would check date continuity
    },
    category: 'general'
  },
  {
    id: 'game-enthusiast',
    title: 'Game Enthusiast',
    description: 'Play 50 games total',
    icon: 'sparkles',
    criteria: (scores: Score[]) => scores.length >= 50,
    category: 'general'
  }
];

// Wordle achievements
export const wordleAchievements: Achievement[] = [
  {
    id: 'wordle-first',
    title: 'Word Beginner',
    description: 'Complete your first Wordle puzzle',
    icon: 'bookmark',
    criteria: (scores: Score[]) => scores.length > 0,
    category: 'wordle',
    gameId: 'wordle'
  },
  {
    id: 'wordle-master',
    title: 'Word Master',
    description: 'Solve Wordle in 2 attempts or fewer',
    icon: 'star',
    criteria: (scores: Score[]) => scores.some(score => score.value <= 2),
    category: 'wordle',
    gameId: 'wordle'
  },
  {
    id: 'wordle-streak',
    title: 'Perfect Streak',
    description: 'Maintain a 7-day streak in Wordle',
    icon: 'trophy',
    criteria: (scores: Score[]) => {
      // Implementation would track date sequences
      return false; // Placeholder - real implementation would check date continuity
    },
    category: 'wordle',
    gameId: 'wordle'
  },
  {
    id: 'wordle-persistence',
    title: 'Persistence Pays Off',
    description: 'Complete Wordle in exactly 6 attempts',
    icon: 'target',
    criteria: (scores: Score[]) => scores.some(score => score.value === 6),
    category: 'wordle',
    gameId: 'wordle'
  }
];

// Quordle achievements
export const quordleAchievements: Achievement[] = [
  {
    id: 'quordle-first',
    title: 'Quadruple Threat',
    description: 'Complete your first Quordle puzzle',
    icon: 'grid',
    criteria: (scores: Score[]) => scores.length > 0,
    category: 'quordle',
    gameId: 'quordle'
  },
  {
    id: 'quordle-master',
    title: 'Quordle Master',
    description: 'Complete Quordle in 5 attempts or fewer',
    icon: 'circle-check',
    criteria: (scores: Score[]) => scores.some(score => score.value <= 5),
    category: 'quordle',
    gameId: 'quordle'
  },
  {
    id: 'quordle-expert',
    title: 'Quordle Expert',
    description: 'Complete 10 Quordle puzzles',
    icon: 'badge-check',
    criteria: (scores: Score[]) => scores.length >= 10,
    category: 'quordle',
    gameId: 'quordle'
  }
];

// Tightrope achievements
export const tightropeAchievements: Achievement[] = [
  {
    id: 'tightrope-first',
    title: 'Balancing Act',
    description: 'Complete your first Tightrope puzzle',
    icon: 'gem',
    criteria: (scores: Score[]) => scores.length > 0,
    category: 'tightrope',
    gameId: 'tightrope'
  },
  {
    id: 'tightrope-master',
    title: 'Perfect Balance',
    description: 'Score 7 points in Tightrope',
    icon: 'badge-check',
    criteria: (scores: Score[]) => scores.some(score => score.value === 7),
    category: 'tightrope',
    gameId: 'tightrope'
  },
  {
    id: 'tightrope-adept',
    title: 'Tightrope Adept',
    description: 'Complete 15 Tightrope puzzles',
    icon: 'star',
    criteria: (scores: Score[]) => scores.length >= 15,
    category: 'tightrope',
    gameId: 'tightrope'
  }
];

// Mini Crossword achievements
export const crosswordAchievements: Achievement[] = [
  {
    id: 'crossword-first',
    title: 'Crossing Words',
    description: 'Complete your first Mini Crossword',
    icon: 'pen-tool',
    criteria: (scores: Score[]) => scores.length > 0,
    category: 'mini-crossword',
    gameId: 'mini-crossword'
  },
  {
    id: 'crossword-speed',
    title: 'Speed Solver',
    description: 'Complete Mini Crossword in under 60 seconds',
    icon: 'clock',
    criteria: (scores: Score[]) => scores.some(score => score.value < 60),
    category: 'mini-crossword',
    gameId: 'mini-crossword'
  },
  {
    id: 'crossword-expert',
    title: 'Crossword Expert',
    description: 'Complete 20 Mini Crosswords',
    icon: 'award',
    criteria: (scores: Score[]) => scores.length >= 20,
    category: 'mini-crossword',
    gameId: 'mini-crossword'
  },
  {
    id: 'crossword-master',
    title: 'Crossword Master',
    description: 'Complete the Mini Crossword in under 2 minutes 5 times',
    icon: 'sparkles',
    criteria: (scores: Score[]) => {
      const underTwoMinutes = scores.filter(score => score.value < 120);
      return underTwoMinutes.length >= 5;
    },
    category: 'mini-crossword',
    gameId: 'mini-crossword'
  }
];

// Combine all achievements
export const allAchievements: Achievement[] = [
  ...generalAchievements,
  ...wordleAchievements,
  ...quordleAchievements,
  ...tightropeAchievements,
  ...crosswordAchievements
];

// Helper function to get achievements by category
export const getAchievementsByCategory = (category: string): Achievement[] => {
  return allAchievements.filter(achievement => achievement.category === category);
};

// Helper function to get game-specific achievements
export const getAchievementsByGame = (gameId: string): Achievement[] => {
  return allAchievements.filter(achievement => achievement.gameId === gameId);
};

// Function to get all achievements for a player based on their scores
export const getPlayerAchievements = (playerId: string): Achievement[] => {
  const playerScores = getScoresByPlayerId(playerId);
  
  return allAchievements.map(achievement => {
    let achievementScores = playerScores;
    
    // Filter scores by game if this is a game-specific achievement
    if (achievement.gameId) {
      achievementScores = achievementScores.filter(score => score.gameId === achievement.gameId);
    }
    
    // Check if the player has met the criteria for this achievement
    const unlockedAt = achievement.criteria(achievementScores) 
      ? new Date().toISOString() // In a real app, this would be when they actually achieved it
      : undefined;
    
    return {
      ...achievement,
      unlockedAt
    };
  });
};

// Get a player's progress towards an achievement
export const getAchievementProgress = (
  playerId: string, 
  achievementId: string
): { current: number; target: number; percentage: number } => {
  // This is a simplified implementation
  // A real implementation would calculate actual progress values
  const playerAchievements = getPlayerAchievements(playerId);
  const achievement = playerAchievements.find(a => a.id === achievementId);
  
  if (!achievement) {
    return { current: 0, target: 1, percentage: 0 };
  }
  
  // If unlocked, return 100% progress
  if (achievement.unlockedAt) {
    return { current: 1, target: 1, percentage: 100 };
  }
  
  // Return a placeholder progress
  // In a real app, this would be more sophisticated
  return { current: 0, target: 1, percentage: 0 };
};
