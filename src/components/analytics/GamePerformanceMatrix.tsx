import { useMemo } from 'react';
import { Score, Player } from '@/utils/types';
import { games } from '@/utils/gameData';
import { TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';
import { subDays, parseISO } from 'date-fns';

interface GamePerformanceMatrixProps {
  allScores: Score[];
  friends: Player[];
}

interface GameStats {
  gameId: string;
  gameName: string;
  gameColor: string;
  bestScore: number;
  averageScore: number;
  recentTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  totalPlays: number;
  friendComparison?: 'better' | 'worse' | 'same';
}

export const GamePerformanceMatrix = ({ allScores, friends }: GamePerformanceMatrixProps) => {
  const gameStats = useMemo(() => {
    const playedGameIds = new Set(allScores.map(s => s.gameId));
    const playedGames = games.filter(g => playedGameIds.has(g.id));

    const stats: GameStats[] = playedGames.map(game => {
      const gameScores = allScores.filter(s => s.gameId === game.id);

      // Best score
      const bestScore = game.lowerIsBetter
        ? Math.min(...gameScores.map(s => s.value))
        : Math.max(...gameScores.map(s => s.value));

      // Average score
      const averageScore = gameScores.reduce((sum, s) => sum + s.value, 0) / gameScores.length;

      // Recent trend (last 7 days vs previous 7 days)
      const today = new Date();
      const last7DaysStart = subDays(today, 7);
      const previous7DaysStart = subDays(today, 14);

      const recentScores = gameScores.filter(s => parseISO(s.date) >= last7DaysStart);
      const previousScores = gameScores.filter(s => {
        const date = parseISO(s.date);
        return date >= previous7DaysStart && date < last7DaysStart;
      });

      let recentTrend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercentage = 0;

      if (recentScores.length > 0 && previousScores.length > 0) {
        const recentAvg = recentScores.reduce((sum, s) => sum + s.value, 0) / recentScores.length;
        const previousAvg = previousScores.reduce((sum, s) => sum + s.value, 0) / previousScores.length;

        trendPercentage = Math.abs(Math.round(((recentAvg - previousAvg) / previousAvg) * 100));

        // For games where lower is better, improvement means recent < previous
        // For games where higher is better, improvement means recent > previous
        if (game.lowerIsBetter) {
          if (recentAvg < previousAvg && trendPercentage > 5) recentTrend = 'up'; // improving (lower scores)
          else if (recentAvg > previousAvg && trendPercentage > 5) recentTrend = 'down'; // declining (higher scores)
        } else {
          if (recentAvg > previousAvg && trendPercentage > 5) recentTrend = 'up'; // improving (higher scores)
          else if (recentAvg < previousAvg && trendPercentage > 5) recentTrend = 'down'; // declining (lower scores)
        }
      }

      return {
        gameId: game.id,
        gameName: game.name,
        gameColor: game.color,
        bestScore: Math.round(bestScore * 10) / 10,
        averageScore: Math.round(averageScore * 10) / 10,
        recentTrend,
        trendPercentage,
        totalPlays: gameScores.length,
      };
    });

    // Sort by total plays (most played first)
    return stats.sort((a, b) => b.totalPlays - a.totalPlays);
  }, [allScores]);

  if (gameStats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No game data available yet
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Performance summary for each game you've played
      </p>

      <div className="grid gap-3">
        {gameStats.map(stat => (
          <div
            key={stat.gameId}
            className="glass-card rounded-lg p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-3 h-3 rounded-full ${stat.gameColor}`} />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{stat.gameName}</h4>
                  <p className="text-xs text-muted-foreground">{stat.totalPlays} plays</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Best</div>
                  <div className="text-sm font-semibold">{stat.bestScore}</div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Average</div>
                  <div className="text-sm font-semibold">{stat.averageScore}</div>
                </div>

                <div className="text-center min-w-[60px]">
                  <div className="text-xs text-muted-foreground mb-1">Trend</div>
                  <div className="flex items-center justify-center gap-1">
                    {getTrendIcon(stat.recentTrend)}
                    {stat.recentTrend !== 'stable' && (
                      <span className="text-xs">{stat.trendPercentage}%</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {friends.length === 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 p-3 bg-secondary/20 rounded-lg">
          <Users className="h-4 w-4" />
          <span>Add friends to see performance comparisons</span>
        </div>
      )}
    </div>
  );
};
