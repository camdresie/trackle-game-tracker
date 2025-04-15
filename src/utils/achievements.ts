import { Game, Score, Achievement } from './types';
import { getGameById, games } from './gameData';
import { supabase } from '@/lib/supabase';

// General achievements
export const generalAchievements: Achievement[] = [
  {
    id: 'first-play',
    name: 'First Play',
    title: 'First Steps',
    description: 'Play your first game',
    icon: 'flag',
    color: 'bg-green-500',
    earned: false,
    criteria: (scores: Score[]) => scores.length > 0,
    category: 'general',
    target: 1
  },
  {
    id: 'all-games',
    name: 'Game Master',
    title: 'Game Master',
    description: 'Play all available games',
    icon: 'crown',
    color: 'bg-amber-500',
    earned: false,
    criteria: (scores: Score[]) => {
      const uniqueGames = new Set(scores.map(score => score.gameId));
      return uniqueGames.size >= games.length;
    },
    category: 'general',
    target: games.length
  },
  {
    id: 'daily-player',
    name: 'Daily Devotion',
    title: 'Daily Devotion',
    description: 'Play games for 7 consecutive days',
    icon: 'calendar',
    color: 'bg-blue-500',
    earned: false,
    criteria: (scores: Score[]) => {
      // Sort scores by date
      const sortedScores = [...scores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let currentStreak = 1;
      let maxStreak = 1;

      for (let i = 1; i < sortedScores.length; i++) {
        const prevDate = new Date(sortedScores[i - 1].date);
        const currDate = new Date(sortedScores[i].date);
        const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else if (dayDiff > 1) {
          currentStreak = 1;
        }
      }

      return maxStreak >= 7;
    },
    category: 'general',
    target: 7
  },
  {
    id: 'game-enthusiast',
    name: 'Game Enthusiast',
    title: 'Game Enthusiast',
    description: 'Play 50 games total',
    icon: 'sparkles',
    color: 'bg-purple-500',
    earned: false,
    criteria: (scores: Score[]) => scores.length >= 50,
    category: 'general',
    target: 50
  }
];

// Wordle achievements
export const wordleAchievements: Achievement[] = [
  {
    id: 'wordle-first',
    name: 'Word Beginner',
    title: 'Word Beginner',
    description: 'Complete your first Wordle puzzle',
    icon: 'bookmark',
    color: 'bg-emerald-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'wordle').length > 0,
    category: 'wordle',
    gameId: 'wordle',
    target: 1
  },
  {
    id: 'wordle-master',
    name: 'Word Master',
    title: 'Word Master',
    description: 'Solve Wordle in 2 attempts or fewer',
    icon: 'star',
    color: 'bg-amber-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'wordle').some(score => score.value <= 2),
    category: 'wordle',
    gameId: 'wordle',
    target: 2
  },
  {
    id: 'wordle-streak',
    name: 'Perfect Streak',
    title: 'Perfect Streak',
    description: 'Maintain a 7-day streak in Wordle',
    icon: 'trophy',
    color: 'bg-amber-500',
    earned: false,
    criteria: (scores: Score[]) => {
      const wordleScores = scores.filter(s => s.gameId === 'wordle')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let currentStreak = 1;
      let maxStreak = 1;

      for (let i = 1; i < wordleScores.length; i++) {
        const prevDate = new Date(wordleScores[i - 1].date);
        const currDate = new Date(wordleScores[i].date);
        const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else if (dayDiff > 1) {
          currentStreak = 1;
        }
      }

      return maxStreak >= 7;
    },
    category: 'wordle',
    gameId: 'wordle',
    target: 7
  },
  {
    id: 'wordle-persistence',
    name: 'Persistence',
    title: 'Persistence Pays Off',
    description: 'Complete Wordle in exactly 6 attempts',
    icon: 'target',
    color: 'bg-orange-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'wordle').some(score => score.value === 6),
    category: 'wordle',
    gameId: 'wordle',
    target: 6
  }
];

// Quordle achievements
export const quordleAchievements: Achievement[] = [
  {
    id: 'quordle-first',
    name: 'Quadruple Threat',
    title: 'Quadruple Threat',
    description: 'Complete your first Quordle puzzle',
    icon: 'grid',
    color: 'bg-purple-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'quordle').length > 0,
    category: 'quordle',
    gameId: 'quordle',
    target: 1
  },
  {
    id: 'quordle-master',
    name: 'Quordle Master',
    title: 'Quordle Master',
    description: 'Complete Quordle in 5 attempts or fewer',
    icon: 'circle-check',
    color: 'bg-purple-500',
    earned: false,
    criteria: (scores: Score[]) => scores.some(score => score.value <= 5),
    category: 'quordle',
    gameId: 'quordle',
    target: 5
  },
  {
    id: 'quordle-expert',
    name: 'Quordle Expert',
    title: 'Quordle Expert',
    description: 'Complete 10 Quordle puzzles',
    icon: 'badge-check',
    color: 'bg-purple-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'quordle').length >= 10,
    category: 'quordle',
    gameId: 'quordle',
    target: 10
  }
];

// Tightrope achievements
export const tightropeAchievements: Achievement[] = [
  {
    id: 'tightrope-first',
    name: 'Balancing Act',
    title: 'Balancing Act',
    description: 'Complete your first Tightrope puzzle',
    icon: 'gem',
    color: 'bg-blue-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'tightrope').length > 0,
    category: 'tightrope',
    gameId: 'tightrope',
    target: 1
  },
  {
    id: 'tightrope-master',
    name: 'Perfect Balance',
    title: 'Perfect Balance',
    description: 'Score 4000+ points in Tightrope',
    icon: 'badge-check',
    color: 'bg-blue-500',
    earned: false,
    criteria: (scores: Score[]) => scores.some(score => score.gameId === 'tightrope' && score.value >= 4000),
    category: 'tightrope',
    gameId: 'tightrope',
    target: 4000
  },
  {
    id: 'tightrope-adept',
    name: 'Tightrope Adept',
    title: 'Tightrope Adept',
    description: 'Complete 15 Tightrope puzzles',
    icon: 'star',
    color: 'bg-blue-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'tightrope').length >= 15,
    category: 'tightrope',
    gameId: 'tightrope',
    target: 15
  }
];

// Mini Crossword achievements
export const crosswordAchievements: Achievement[] = [
  {
    id: 'crossword-first',
    name: 'Crossing Words',
    title: 'Crossing Words',
    description: 'Complete your first Mini Crossword',
    icon: 'pen-tool',
    color: 'bg-rose-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'mini-crossword').length > 0,
    category: 'mini-crossword',
    gameId: 'mini-crossword',
    target: 1
  },
  {
    id: 'crossword-speed',
    name: 'Speed Solver',
    title: 'Speed Solver',
    description: 'Complete Mini Crossword in under 60 seconds',
    icon: 'clock',
    color: 'bg-rose-500',
    earned: false,
    criteria: (scores: Score[]) => scores.some(score => score.value < 60),
    category: 'mini-crossword',
    gameId: 'mini-crossword',
    target: 60
  },
  {
    id: 'crossword-expert',
    name: 'Crossword Expert',
    title: 'Crossword Expert',
    description: 'Complete 20 Mini Crosswords',
    icon: 'award',
    color: 'bg-rose-500',
    earned: false,
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'mini-crossword').length >= 20,
    category: 'mini-crossword',
    gameId: 'mini-crossword',
    target: 20
  },
  {
    id: 'crossword-master',
    name: 'Crossword Master',
    title: 'Crossword Master',
    description: 'Complete the Mini Crossword in under 2 minutes 5 times',
    icon: 'sparkles',
    color: 'bg-rose-500',
    earned: false,
    criteria: (scores: Score[]) => {
      const underTwoMinutes = scores.filter(score => score.value < 120);
      return underTwoMinutes.length >= 5;
    },
    category: 'mini-crossword',
    gameId: 'mini-crossword',
    target: 5
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
export const getPlayerAchievements = async (playerId: string): Promise<Achievement[]> => {
  const { data: scores, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', playerId);

  if (error) {
    console.error('Error fetching scores:', error);
    return allAchievements.map(achievement => ({
      ...achievement,
      unlockedAt: undefined
    }));
  }

  return allAchievements.map(achievement => {
    const achievementScores = achievement.gameId
      ? scores.filter(score => score.game_id === achievement.gameId)
      : scores;

    // Check if the player has met the criteria for this achievement
    const unlocked = achievement.criteria ? achievement.criteria(achievementScores.map(score => ({
      id: score.id,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes,
      createdAt: score.created_at || new Date().toISOString() // Add createdAt
    }))) : false;

    return {
      ...achievement,
      unlockedAt: unlocked ? new Date().toISOString() : undefined
    };
  });
};

// Get a player's progress towards an achievement
export const getAchievementProgress = async (
  playerId: string, 
  achievementId: string
): Promise<{ current: number; target: number; percentage: number }> => {
  const { data: scores, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', playerId);

  if (error) {
    console.error('Error fetching scores:', error);
    return { current: 0, target: 1, percentage: 0 };
  }

  const achievement = allAchievements.find(a => a.id === achievementId);
  
  if (!achievement) {
    return { current: 0, target: 1, percentage: 0 };
  }

  const mappedScores = scores.map(score => ({
    id: score.id,
    gameId: score.game_id,
    playerId: score.user_id,
    value: score.value,
    date: score.date,
    notes: score.notes,
    createdAt: score.created_at || new Date().toISOString() // Add createdAt
  }));

  // Calculate progress based on achievement type
  switch (achievementId) {
    case 'first-play':
      return {
        current: mappedScores.length,
        target: 1,
        percentage: mappedScores.length > 0 ? 100 : 0
      };
    
    case 'all-games':
      const uniqueGames = new Set(mappedScores.map(score => score.gameId));
      return {
        current: uniqueGames.size,
        target: games.length,
        percentage: Math.round((uniqueGames.size / games.length) * 100)
      };
    
    case 'game-enthusiast':
      return {
        current: mappedScores.length,
        target: 50,
        percentage: Math.min(Math.round((mappedScores.length / 50) * 100), 100)
      };
    
    case 'tightrope-master':
      const highestTightropeScore = mappedScores
        .filter(score => score.gameId === 'tightrope')
        .reduce((max, score) => Math.max(max, score.value), 0);
      return {
        current: highestTightropeScore,
        target: 4000,
        percentage: Math.min(Math.round((highestTightropeScore / 4000) * 100), 100)
      };
    
    default:
      // For achievements that are either unlocked or not
      const unlocked = achievement.criteria(mappedScores);
      return {
        current: unlocked ? 1 : 0,
        target: 1,
        percentage: unlocked ? 100 : 0
      };
  }
};
