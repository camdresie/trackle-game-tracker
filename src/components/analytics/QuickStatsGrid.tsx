import { useMemo } from 'react';
import { Score } from '@/utils/types';
import { games } from '@/utils/gameData';
import { Trophy, Target, Flame, TrendingUp } from 'lucide-react';
import { subDays, format, parseISO, differenceInDays } from 'date-fns';

interface QuickStatsGridProps {
  allScores: Score[];
}

export const QuickStatsGrid = ({ allScores }: QuickStatsGridProps) => {
  const stats = useMemo(() => {
    if (allScores.length === 0) {
      return {
        totalGames: 0,
        currentStreak: 0,
        personalBests: 0,
        weeklyTrend: 0,
        weeklyTrendDirection: 'neutral' as 'up' | 'down' | 'neutral',
      };
    }

    // Total games played
    const totalGames = allScores.length;

    // Calculate current streak (consecutive days with at least one score)
    const sortedDates = Array.from(new Set(allScores.map(s => s.date))).sort().reverse();
    let currentStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (sortedDates[i] === expectedDate || (i === 0 && sortedDates[i] === format(subDays(new Date(), 1), 'yyyy-MM-dd'))) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Count personal bests (games where user has achieved the optimal score)
    let personalBests = 0;
    games.forEach(game => {
      const gameScores = allScores.filter(s => s.gameId === game.id);
      if (gameScores.length === 0) return;

      const bestValue = game.lowerIsBetter
        ? Math.min(...gameScores.map(s => s.value))
        : Math.max(...gameScores.map(s => s.value));

      // Check if best value matches the optimal score for the game
      if (game.lowerIsBetter && bestValue === 1) {
        personalBests++;
      } else if (!game.lowerIsBetter && bestValue === game.maxScore) {
        personalBests++;
      }
    });

    // This week vs last week performance
    const today_date = new Date();
    const thisWeekStart = subDays(today_date, 7);
    const lastWeekStart = subDays(today_date, 14);

    const thisWeekScores = allScores.filter(s => {
      const scoreDate = parseISO(s.date);
      return scoreDate >= thisWeekStart;
    });

    const lastWeekScores = allScores.filter(s => {
      const scoreDate = parseISO(s.date);
      return scoreDate >= lastWeekStart && scoreDate < thisWeekStart;
    });

    let weeklyTrend = 0;
    let weeklyTrendDirection: 'up' | 'down' | 'neutral' = 'neutral';

    if (thisWeekScores.length > 0 && lastWeekScores.length > 0) {
      const thisWeekAvg = thisWeekScores.length;
      const lastWeekAvg = lastWeekScores.length;
      weeklyTrend = Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100);

      if (weeklyTrend > 5) weeklyTrendDirection = 'up';
      else if (weeklyTrend < -5) weeklyTrendDirection = 'down';
    } else if (thisWeekScores.length > 0 && lastWeekScores.length === 0) {
      weeklyTrend = 100;
      weeklyTrendDirection = 'up';
    }

    return {
      totalGames,
      currentStreak,
      personalBests,
      weeklyTrend: Math.abs(weeklyTrend),
      weeklyTrendDirection,
    };
  }, [allScores]);

  const statCards = [
    {
      icon: <Target className="h-5 w-5 text-blue-500" />,
      label: 'Total Games',
      value: stats.totalGames.toLocaleString(),
      subtext: 'all time',
    },
    {
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      label: 'Current Streak',
      value: stats.currentStreak,
      subtext: stats.currentStreak === 1 ? 'day' : 'days',
    },
    {
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      label: 'Perfect Scores',
      value: stats.personalBests,
      subtext: 'games mastered',
    },
    {
      icon: <TrendingUp className={`h-5 w-5 ${
        stats.weeklyTrendDirection === 'up' ? 'text-green-500' :
        stats.weeklyTrendDirection === 'down' ? 'text-red-500' :
        'text-gray-500'
      }`} />,
      label: 'This Week',
      value: stats.weeklyTrendDirection === 'neutral' ? '~' : `${stats.weeklyTrendDirection === 'up' ? '+' : '-'}${stats.weeklyTrend}%`,
      subtext: 'vs last week',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="glass-card rounded-lg p-4 flex flex-col items-center text-center"
        >
          <div className="mb-2">{stat.icon}</div>
          <div className="text-2xl font-bold mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground mb-0.5">{stat.label}</div>
          <div className="text-xs text-muted-foreground">{stat.subtext}</div>
        </div>
      ))}
    </div>
  );
};
