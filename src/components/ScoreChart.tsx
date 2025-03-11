import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart
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
  formattedValue: string | number;
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
  const baseColor = color || (game?.color ? game.color.replace('bg-', '') : "blue-500");
  
  // Generate gradient colors for the chart
  const getColorOpacity = (opacity: string) => {
    const colorMap: Record<string, string> = {
      "emerald-500": `rgba(16, 185, 129, ${opacity})`,
      "blue-500": `rgba(59, 130, 246, ${opacity})`,
      "purple-500": `rgba(168, 85, 247, ${opacity})`,
      "rose-500": `rgba(244, 63, 94, ${opacity})`,
      "amber-500": `rgba(245, 158, 11, ${opacity})`,
    };
    
    return colorMap[baseColor] || colorMap["blue-500"];
  };
  
  // For Wordle, lower scores are better
  const isAscending = effectiveGameId === 'wordle';
  
  useEffect(() => {
    if (!scores.length) return;
    
    // Sort scores by date
    const sortedScores = [...scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Format dates for display using consistent approach
    const formattedScores = sortedScores.map(score => {
      // Create date object from score date string
      const [year, month, day] = score.date.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed in JS
      
      // Format value based on game type
      let formattedValue: string | number = score.value;
      if (effectiveGameId === 'mini-crossword') {
        const minutes = Math.floor(score.value / 60);
        const seconds = score.value % 60;
        formattedValue = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      return {
        // Format date for display
        date: `${date.toLocaleString('default', { month: 'short' })} ${day}`,
        // Keep the original date string for tooltip
        originalDate: score.date,
        value: score.value,
        formattedValue
      };
    });
    
    console.log('Chart data prepared:', formattedScores);
    setChartData(formattedScores);
  }, [scores, effectiveGameId]);
  
  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-secondary/30 rounded-lg">
        <p className="text-muted-foreground">No score data available</p>
      </div>
    );
  }
  
  // Calculate domain for Y axis
  const values = chartData.map(point => point.value);
  const minValue = Math.max(0, Math.min(...values) - 1);
  const maxValue = Math.max(...values) + 1;
  
  // Calculate average for reference line
  const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
  const averageLabel = isAscending ? 'Average Attempts' : 'Average Score';
  
  return (
    <div className="w-full h-64 animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        {simplified ? (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickLine={{ stroke: '#f0f0f0' }}
              axisLine={{ stroke: '#f0f0f0' }}
              height={20}
              hide={chartData.length > 10}
            />
            <YAxis 
              domain={[minValue, maxValue]}
              tick={{ fontSize: 10 }}
              tickLine={{ stroke: '#f0f0f0' }}
              axisLine={{ stroke: '#f0f0f0' }}
              width={25}
              hide
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid #f0f0f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
              formatter={(value: number, name: string, props: any) => {
                const dataPoint = props.payload;
                return [dataPoint.formattedValue, 'Score'];
              }}
              labelFormatter={(label: string, payload: any[]) => {
                if (payload.length > 0) {
                  return payload[0].payload.originalDate;
                }
                return label;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getColorOpacity("1")}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, stroke: getColorOpacity("1"), strokeWidth: 2, fill: 'white' }}
              isAnimationActive
              animationDuration={2000}
              animationEasing="ease-in-out"
            />
          </LineChart>
        ) : (
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getColorOpacity("0.8")} stopOpacity={0.8} />
                <stop offset="95%" stopColor={getColorOpacity("0.2")} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              formatter={(value: number, name: string, props: any) => {
                const dataPoint = props.payload;
                return [dataPoint.formattedValue, 'Score'];
              }}
              labelFormatter={(label: string, payload: any[]) => {
                if (payload.length > 0) {
                  return payload[0].payload.originalDate;
                }
                return label;
              }}
            />
            {/* Removed duplicate legend - only show one in GameDetail.tsx */}
            <ReferenceLine 
              y={averageValue} 
              label={{ 
                value: averageLabel, 
                position: 'insideBottomRight',
                fontSize: 11,
                fill: '#6b7280'
              }} 
              stroke="#6b7280" 
              strokeDasharray="3 3" 
            />
            {/* Removed the "Best Attempt" reference line as requested */}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={getColorOpacity("1")} 
              strokeWidth={0} 
              fillOpacity={1} 
              fill="url(#colorScore)" 
              isAnimationActive
              animationDuration={2000}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getColorOpacity("1")}
              strokeWidth={2.5}
              dot={{ 
                stroke: getColorOpacity("1"), 
                strokeWidth: 2, 
                r: 4, 
                fill: 'white'
              }}
              activeDot={{ 
                r: 6, 
                stroke: getColorOpacity("1"), 
                strokeWidth: 2, 
                fill: 'white'
              }}
              isAnimationActive
              animationDuration={2500}
              animationEasing="ease-out"
              connectNulls
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreChart;
