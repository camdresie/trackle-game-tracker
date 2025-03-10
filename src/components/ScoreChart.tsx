
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
import { Score } from '@/utils/types';

interface ScoreChartProps {
  scores: Score[];
  color?: string;
  gameId: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

const ScoreChart = ({ scores, color = "#3182ce", gameId }: ScoreChartProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  useEffect(() => {
    if (!scores.length) return;
    
    // Sort scores by date
    const sortedScores = [...scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Transform to chart data
    const data = sortedScores.map(score => ({
      date: new Date(score.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: score.value
    }));
    
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
  const isAscending = gameId === 'wordle';
  
  // Calculate domain for Y axis
  const values = chartData.map(point => point.value);
  const minValue = Math.max(0, Math.min(...values) - 1);
  const maxValue = Math.max(...values) + 1;
  
  return (
    <div className="w-full h-64 animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#f0f0f0' }}
            axisLine={{ stroke: '#f0f0f0' }}
          />
          <YAxis 
            domain={[minValue, maxValue]}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#f0f0f0' }}
            axisLine={{ stroke: '#f0f0f0' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              border: '1px solid #f0f0f0',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          <Legend 
            formatter={(value) => <span className="text-sm font-medium">Score</span>}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ stroke: color, strokeWidth: 2, r: 4, fill: 'white' }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'white' }}
            isAnimationActive={true}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreChart;
