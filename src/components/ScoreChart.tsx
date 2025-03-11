
import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { Score, Game } from '@/utils/types';

interface ScoreChartProps {
  scores: Score[];
  color?: string;
  gameId?: string;
  game?: Game;
  simplified?: boolean;
}

interface ChartDataPoint {
  date: string;
  originalDate: string;
  value: number;
}

const ScoreChart = ({ 
  scores, 
  color, 
  gameId, 
  game, 
  simplified = false 
}: ScoreChartProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  // Determine the game ID from either the direct gameId prop or from the game object
  const effectiveGameId = gameId || (game?.id);
  // Determine the color from either the direct color prop or from the game object
  const effectiveColor = color || (game?.color ? game.color.replace('bg-', '') : "#3182ce");
  
  useEffect(() => {
    if (!scores.length) return;
    
    // Sort scores by date
    const sortedScores = [...scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Group scores by date to ensure we only have one point per day
    const scoresByDate = sortedScores.reduce<Record<string, ChartDataPoint>>((acc, score) => {
      const date = score.date;
      if (!acc[date]) {
        acc[date] = {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          originalDate: date,
          value: score.value
        };
      }
      return acc;
    }, {});
    
    // Convert back to array
    const data = Object.values(scoresByDate);
    
    console.log('Chart data prepared:', data);
    setChartData(data);
  }, [scores]);
  
  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-secondary/30 rounded-lg">
        <p className="text-muted-foreground">No score data available</p>
      </div>
    );
  }
  
  // For Wordle, lower scores are better
  const isAscending = effectiveGameId === 'wordle';
  
  // Calculate domain for Y axis
  const values = chartData.map(point => point.value);
  const minValue = Math.max(0, Math.min(...values) - 1);
  const maxValue = Math.max(...values) + 1;
  
  return (
    <div className="w-full h-64 animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={simplified ? { top: 5, right: 10, left: 0, bottom: 5 } : { top: 5, right: 20, left: 5, bottom: 5 }}
        >
          {!simplified && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: simplified ? 10 : 12 }}
            tickLine={{ stroke: '#f0f0f0' }}
            axisLine={{ stroke: '#f0f0f0' }}
            height={simplified ? 20 : 30}
            hide={simplified && chartData.length > 10}
          />
          <YAxis 
            domain={[minValue, maxValue]}
            tick={{ fontSize: simplified ? 10 : 12 }}
            tickLine={{ stroke: '#f0f0f0' }}
            axisLine={{ stroke: '#f0f0f0' }}
            width={simplified ? 25 : 35}
            hide={simplified}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              border: '1px solid #f0f0f0',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
            formatter={(value: number, name: string, props: any) => {
              return [value, 'Score'];
            }}
            labelFormatter={(label: string, payload: any[]) => {
              if (payload.length > 0) {
                const item = payload[0].payload;
                return item.originalDate;
              }
              return label;
            }}
          />
          {!simplified && (
            <Legend 
              formatter={(value) => <span className="text-sm font-medium">Score</span>}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={effectiveColor}
            strokeWidth={simplified ? 1.5 : 2.5}
            dot={simplified ? false : { stroke: effectiveColor, strokeWidth: 2, r: 4, fill: 'white' }}
            activeDot={{ r: simplified ? 4 : 6, stroke: effectiveColor, strokeWidth: 2, fill: 'white' }}
            isAnimationActive={!simplified}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreChart;
