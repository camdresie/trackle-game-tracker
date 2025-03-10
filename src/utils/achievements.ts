import { Game, Score, Achievement } from './types';
import { getGameById, games } from './gameData';
import { supabase } from '@/lib/supabase';

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
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'wordle').length > 0,
    category: 'wordle',
    gameId: 'wordle'
  },
  {
    id: 'wordle-master',
    title: 'Word Master',
    description: 'Solve Wordle in 2 attempts or fewer',
    icon: 'star',
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'wordle').some(score => score.value <= 2),
    category: 'wordle',
    gameId: 'wordle'
  },
  {
    id: 'wordle-streak',
    title: 'Perfect Streak',
    description: 'Maintain a 7-day streak in Wordle',
    icon: 'trophy',
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
    gameId: 'wordle'
  },
  {
    id: 'wordle-persistence',
    title: 'Persistence Pays Off',
    description: 'Complete Wordle in exactly 6 attempts',
    icon: 'target',
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'wordle').some(score => score.value === 6),
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
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'quordle').length > 0,
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
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'quordle').length >= 10,
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
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'tightrope').length > 0,
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
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'tightrope').length >= 15,
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
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'mini-crossword').length > 0,
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
    criteria: (scores: Score[]) => scores.filter(s => s.gameId === 'mini-crossword').length >= 20,
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

  console.log('Fetched scores for achievements:', scores);

  return allAchievements.map(achievement => {
    const achievementScores = achievement.gameId
      ? scores.filter(score => score.game_id === achievement.gameId)
      : scores;

    // Check if the player has met the criteria for this achievement
    const unlocked = achievement.criteria(achievementScores.map(score => ({
      id: score.id,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes
    })));

    console.log(`Achievement ${achievement.id} unlocked:`, unlocked);

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
    notes: score.notes
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
