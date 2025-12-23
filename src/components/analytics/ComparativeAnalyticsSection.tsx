import { useMemo } from 'react';
import { Score } from '@/utils/types';
import { games } from '@/utils/gameData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Player } from '@/utils/types';

interface ComparativeAnalyticsSectionProps {
  allScores: Score[];
  friends: Player[];
}

export const ComparativeAnalyticsSection = ({ allScores, friends }: ComparativeAnalyticsSectionProps) => {
  const playedGameIds = useMemo(() => {
    return new Set(allScores.map(s => s.gameId));
  }, [allScores]);

  const playedGames = games.filter(g => playedGameIds.has(g.id));

  const userAverages = useMemo(() => {
    const averages = new Map<string, number>();
    
    playedGames.forEach(game => {
      const gameScores = allScores.filter(s => s.gameId === game.id);
      if (gameScores.length > 0) {
        const avg = gameScores.reduce((sum, s) => sum + s.value, 0) / gameScores.length;
        averages.set(game.id, avg);
      }
    });
    
    return averages;
  }, [allScores, playedGames]);

  const chartData = useMemo(() => {
    return playedGames.slice(0, 8).map(game => {
      const userAvg = userAverages.get(game.id) || 0;
      
      return {
        game: game.name.length > 15 ? game.name.substring(0, 12) + '...' : game.name,
        You: Math.round(userAvg * 10) / 10,
      };
    });
  }, [playedGames, userAverages]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No comparison data available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        View your average scores across different games
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="game"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem'
            }}
          />
          <Legend />
          <Bar dataKey="You" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
      
      {friends.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Add friends to unlock friend comparison features in the future
        </p>
      )}
    </div>
  );
};
