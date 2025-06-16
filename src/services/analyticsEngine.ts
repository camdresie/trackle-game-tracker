import { format, parseISO, startOfWeek, endOfWeek, differenceInDays, subDays } from 'date-fns';
import { getGameById } from '@/utils/gameData';

// Types for analytics
export interface ScoreData {
  id: string;
  value: number;
  created_at: string;
  game_id: string;
}

export interface GameStats {
  gameId: string;
  gameName: string;
  totalPlays: number;
  averageScore: number;
  bestScore: number;
  recentAverage: number; // Last 7 days
  trend: 'improving' | 'declining' | 'stable';
  improvementPercentage?: number;
  currentStreak: number;
  longestStreak: number;
}

export interface PlayingPatterns {
  bestDayOfWeek: string;
  worstDayOfWeek: string;
  bestTimeOfDay: string;
  averageGamesPerDay: number;
  totalPlayingDays: number;
  currentOverallStreak: number;
}

export interface AnalyticsData {
  gameStats: GameStats[];
  playingPatterns: PlayingPatterns;
  overallStats: {
    totalGames: number;
    totalDays: number;
    gamesThisWeek: number;
    gamesLastWeek: number;
    favoriteGame: string;
    mostImprovedGame: string;
  };
  insights: {
    hasRecentImprovement: boolean;
    hasActiveStreak: boolean;
    hasConsistentPlaying: boolean;
    topPerformanceDay: string;
  };
}

// Analyze individual game performance
const analyzeGamePerformance = (scores: ScoreData[], gameId: string): GameStats => {
  const game = getGameById(gameId);
  if (!game || scores.length === 0) {
    return {
      gameId,
      gameName: game?.name || 'Unknown Game',
      totalPlays: 0,
      averageScore: 0,
      bestScore: 0,
      recentAverage: 0,
      trend: 'stable',
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  const sortedScores = scores.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Calculate basic stats
  const totalPlays = scores.length;
  const averageScore = scores.reduce((sum, score) => sum + score.value, 0) / totalPlays;
  
  // Calculate best score based on game type
  const bestScore = game.lowerIsBetter 
    ? Math.min(...scores.map(s => s.value))
    : Math.max(...scores.map(s => s.value));

  // Recent performance (last 7 days)
  const sevenDaysAgo = subDays(new Date(), 7);
  const recentScores = scores.filter(score => 
    new Date(score.created_at) >= sevenDaysAgo
  );
  const recentAverage = recentScores.length > 0 
    ? recentScores.reduce((sum, score) => sum + score.value, 0) / recentScores.length
    : averageScore;

  // Calculate trend
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  let improvementPercentage = 0;

  if (recentScores.length >= 3 && scores.length >= 7) {
    const oldAverage = scores.slice(0, -recentScores.length)
      .reduce((sum, score) => sum + score.value, 0) / (scores.length - recentScores.length);
    
    if (game.lowerIsBetter) {
      improvementPercentage = ((oldAverage - recentAverage) / oldAverage) * 100;
    } else {
      improvementPercentage = ((recentAverage - oldAverage) / oldAverage) * 100;
    }

    if (Math.abs(improvementPercentage) > 5) {
      trend = improvementPercentage > 0 ? 'improving' : 'declining';
    }
  }

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(sortedScores);

  return {
    gameId,
    gameName: game.name,
    totalPlays,
    averageScore: Math.round(averageScore * 100) / 100,
    bestScore,
    recentAverage: Math.round(recentAverage * 100) / 100,
    trend,
    improvementPercentage: Math.round(improvementPercentage * 100) / 100,
    currentStreak,
    longestStreak,
  };
};

// Calculate playing streaks (for individual games)
const calculateStreaks = (sortedScores: ScoreData[]) => {
  if (sortedScores.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sortedScores.length; i++) {
    const prevDate = new Date(sortedScores[i - 1].created_at);
    const currDate = new Date(sortedScores[i].created_at);
    const daysDiff = differenceInDays(currDate, prevDate);

    if (daysDiff <= 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (from most recent score)
  const today = new Date();
  const mostRecentScore = sortedScores[sortedScores.length - 1];
  const daysSinceLastPlay = differenceInDays(today, new Date(mostRecentScore.created_at));

  if (daysSinceLastPlay <= 1) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
};

// Calculate daily Trackle streak (consecutive days with at least one score)
const calculateDailyStreak = (sortedDayStrings: string[]): number => {
  if (sortedDayStrings.length === 0) return 0;

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');
  const yesterdayString = format(subDays(today, 1), 'yyyy-MM-dd');

  // Check if user played today or yesterday (to maintain streak)
  const mostRecentDay = sortedDayStrings[sortedDayStrings.length - 1];
  if (mostRecentDay !== todayString && mostRecentDay !== yesterdayString) {
    return 0; // Streak is broken
  }

  // Count consecutive days from the most recent day backwards
  let streak = 1;
  const sortedDates = sortedDayStrings.map(day => new Date(day)).sort((a, b) => b.getTime() - a.getTime());

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDay = sortedDates[i - 1];
    const currDay = sortedDates[i];
    const daysBetween = differenceInDays(prevDay, currDay);

    if (daysBetween === 1) {
      streak++;
    } else {
      break; // Streak is broken
    }
  }

  return streak;
};

// Analyze playing patterns
const analyzePlayingPatterns = (allScores: ScoreData[]): PlayingPatterns => {
  if (allScores.length === 0) {
    return {
      bestDayOfWeek: 'Monday',
      worstDayOfWeek: 'Monday',
      bestTimeOfDay: 'Morning',
      averageGamesPerDay: 0,
      totalPlayingDays: 0,
      currentOverallStreak: 0,
    };
  }

  // Group by day of week
  const dayStats: { [key: string]: number[] } = {};
  const uniqueDays = new Set<string>();

  allScores.forEach(score => {
    const date = parseISO(score.created_at);
    const dayOfWeek = format(date, 'EEEE');
    const dayKey = format(date, 'yyyy-MM-dd');
    
    uniqueDays.add(dayKey);
    
    if (!dayStats[dayOfWeek]) {
      dayStats[dayOfWeek] = [];
    }
    dayStats[dayOfWeek].push(score.value);
  });

  // Find best and worst days (by frequency)
  const dayFrequency = Object.entries(dayStats).map(([day, scores]) => ({
    day,
    frequency: scores.length,
    average: scores.reduce((sum, score) => sum + score, 0) / scores.length
  }));

  dayFrequency.sort((a, b) => b.frequency - a.frequency);
  const bestDayOfWeek = dayFrequency[0]?.day || 'Monday';
  const worstDayOfWeek = dayFrequency[dayFrequency.length - 1]?.day || 'Monday';

  // Determine best time of day (rough estimate)
  const morningPlays = allScores.filter(score => {
    const hour = new Date(score.created_at).getHours();
    return hour >= 6 && hour < 12;
  }).length;

  const afternoonPlays = allScores.filter(score => {
    const hour = new Date(score.created_at).getHours();
    return hour >= 12 && hour < 18;
  }).length;

  const eveningPlays = allScores.filter(score => {
    const hour = new Date(score.created_at).getHours();
    return hour >= 18 || hour < 6;
  }).length;

  let bestTimeOfDay = 'Morning';
  if (afternoonPlays > morningPlays && afternoonPlays > eveningPlays) {
    bestTimeOfDay = 'Afternoon';
  } else if (eveningPlays > morningPlays && eveningPlays > afternoonPlays) {
    bestTimeOfDay = 'Evening';
  }

  const totalPlayingDays = uniqueDays.size;
  const averageGamesPerDay = totalPlayingDays > 0 ? allScores.length / totalPlayingDays : 0;

  // Calculate overall current streak (consecutive days with at least one score)
  const currentOverallStreak = calculateDailyStreak(Array.from(uniqueDays).sort());

  return {
    bestDayOfWeek,
    worstDayOfWeek,
    bestTimeOfDay,
    averageGamesPerDay: Math.round(averageGamesPerDay * 10) / 10,
    totalPlayingDays,
    currentOverallStreak,
  };
};

// Main analytics function
export const generateAnalyticsData = (userScores: ScoreData[]): AnalyticsData => {
  if (!userScores || userScores.length === 0) {
    return {
      gameStats: [],
      playingPatterns: {
        bestDayOfWeek: 'Monday',
        worstDayOfWeek: 'Monday', 
        bestTimeOfDay: 'Morning',
        averageGamesPerDay: 0,
        totalPlayingDays: 0,
        currentOverallStreak: 0,
      },
      overallStats: {
        totalGames: 0,
        totalDays: 0,
        gamesThisWeek: 0,
        gamesLastWeek: 0,
        favoriteGame: '',
        mostImprovedGame: '',
      },
      insights: {
        hasRecentImprovement: false,
        hasActiveStreak: false,
        hasConsistentPlaying: false,
        topPerformanceDay: 'Monday',
      },
    };
  }

  // Group scores by game
  const scoresByGame: { [gameId: string]: ScoreData[] } = {};
  userScores.forEach(score => {
    if (!scoresByGame[score.game_id]) {
      scoresByGame[score.game_id] = [];
    }
    scoresByGame[score.game_id].push(score);
  });

  // Analyze each game
  const gameStats = Object.entries(scoresByGame).map(([gameId, scores]) =>
    analyzeGamePerformance(scores, gameId)
  );

  // Analyze playing patterns
  const playingPatterns = analyzePlayingPatterns(userScores);

  // Calculate overall stats
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = startOfWeek(subDays(now, 7));
  const lastWeekEnd = endOfWeek(subDays(now, 7));

  const gamesThisWeek = userScores.filter(score =>
    new Date(score.created_at) >= thisWeekStart
  ).length;

  const gamesLastWeek = userScores.filter(score => {
    const scoreDate = new Date(score.created_at);
    return scoreDate >= lastWeekStart && scoreDate <= lastWeekEnd;
  }).length;

  // Find favorite game (most played)
  const gameCounts = Object.entries(scoresByGame).map(([gameId, scores]) => ({
    gameId,
    count: scores.length,
    name: getGameById(gameId)?.name || 'Unknown'
  }));
  gameCounts.sort((a, b) => b.count - a.count);
  const favoriteGame = gameCounts[0]?.name || '';

  // Find most improved game
  const improvingGames = gameStats.filter(game => 
    game.trend === 'improving' && game.improvementPercentage && game.improvementPercentage > 0
  );
  improvingGames.sort((a, b) => (b.improvementPercentage || 0) - (a.improvementPercentage || 0));
  const mostImprovedGame = improvingGames[0]?.gameName || '';

  const overallStats = {
    totalGames: userScores.length,
    totalDays: playingPatterns.totalPlayingDays,
    gamesThisWeek,
    gamesLastWeek,
    favoriteGame,
    mostImprovedGame,
  };

  // Generate insights flags
  const hasRecentImprovement = gameStats.some(game => game.trend === 'improving');
  const hasActiveStreak = playingPatterns.currentOverallStreak > 2;
  const hasConsistentPlaying = playingPatterns.averageGamesPerDay >= 1;
  const topPerformanceDay = playingPatterns.bestDayOfWeek;

  const insights = {
    hasRecentImprovement,
    hasActiveStreak,
    hasConsistentPlaying,
    topPerformanceDay,
  };

  return {
    gameStats,
    playingPatterns,
    overallStats,
    insights,
  };
};