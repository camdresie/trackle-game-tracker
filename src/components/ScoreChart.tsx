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
  ComposedChart,
  Label
} from 'recharts';
import { Score, Game } from '@/utils/types';
import { getLabelByGame } from '@/utils/gameData';

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
  
  // Get the appropriate y-axis label based on the game type
  const yAxisLabel = effectiveGameId ? getLabelByGame(effectiveGameId) : "Points";
  
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
  
  // For Wordle, Mini Crossword, and Quordle, lower scores are better
  const isAscending = ['wordle', 'mini-crossword', 'quordle'].includes(effectiveGameId || '');
  
  useEffect(() => {
    if (!scores.length) return;
    
    // Sort scores by date
    const sortedScores = [...scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Determine date format based on data range
    const getDateFormat = (scores: typeof sortedScores) => {
      if (scores.length === 0) return 'short';
      
      const firstDate = new Date(scores[0].date);
      const lastDate = new Date(scores[scores.length - 1].date);
      const daysDiff = Math.abs((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) return 'weekday'; // Mon, Tue, etc.
      if (daysDiff <= 31) return 'short'; // Jan 15, etc.
      if (daysDiff <= 90) return 'month-day'; // 1/15, etc.
      return 'month-year'; // Jan '24, etc.
    };
    
    const dateFormat = getDateFormat(sortedScores);
    
    // Format dates for display using intelligent formatting
    const formattedScores = sortedScores.map(score => {
      // Create date object from score date string
      const [year, month, day] = score.date.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed in JS
      
      // Format date based on data range
      let displayDate: string;
      switch (dateFormat) {
        case 'weekday':
          displayDate = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
          break;
        case 'month-day':
          displayDate = `${month}/${day}`;
          break;
        case 'month-year':
          displayDate = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          break;
        default: // 'short'
          displayDate = `${date.toLocaleString('default', { month: 'short' })} ${day}`;
      }
      
      // Format value based on game type
      let formattedValue: string | number = score.value;
      if (effectiveGameId === 'mini-crossword') {
        if (score.value <= 0) {
            formattedValue = '0:00';
        } else {
            const minutes = Math.floor(score.value / 60);
            const seconds = score.value % 60;
            formattedValue = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
      
      return {
        date: displayDate,
        originalDate: score.date,
        value: score.value,
        formattedValue
      };
    });
    
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
  
  // Calculate X-axis tick interval for better spacing
  const getTickInterval = (dataLength: number) => {
    if (dataLength <= 7) return 0; // Show all ticks for small datasets
    if (dataLength <= 14) return 1; // Show every other tick
    if (dataLength <= 30) return Math.ceil(dataLength / 7); // Show ~7 ticks
    return Math.ceil(dataLength / 10); // Show ~10 ticks for larger datasets
  };
  
  const tickInterval = getTickInterval(chartData.length);
  
  // Calculate average for reference line
  let averageValue = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  let averageLabel = 'Average Score: -';
  if (values.length > 0) {
    if (effectiveGameId === 'mini-crossword') {
      if (averageValue <= 0) {
        averageLabel = 'Average Score: 0:00';
      } else {
        const avgMinutes = Math.floor(averageValue / 60);
        const avgSeconds = Math.round(averageValue % 60); // Round seconds for average
        averageLabel = `Average Score: ${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
      }
    } else {
      averageLabel = `Average Score: ${averageValue.toFixed(2)}`;
    }
  }
  
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
              interval={tickInterval}
              angle={chartData.length > 20 ? -45 : 0}
              textAnchor={chartData.length > 20 ? 'end' : 'middle'}
            >
              {!simplified && (
                <Label value="Date Played" position="insideBottom" offset={-5} style={{ fontSize: '10px', fill: '#6b7280' }} />
              )}
            </XAxis>
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
            margin={{ top: 10, right: 20, left: 25, bottom: 20 }}
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
              height={chartData.length > 20 ? 50 : 30}
              interval={tickInterval}
              angle={chartData.length > 20 ? -45 : 0}
              textAnchor={chartData.length > 20 ? 'end' : 'middle'}
            >
              <Label value="Date Played" position="insideBottom" offset={chartData.length > 20 ? -25 : -10} style={{ fontSize: '12px', fill: '#6b7280' }} />
            </XAxis>
            <YAxis 
              domain={[minValue, maxValue]}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#f0f0f0' }}
              axisLine={{ stroke: '#f0f0f0' }}
              width={40}
              tickFormatter={(tick: number) => {
                if (effectiveGameId === 'mini-crossword') {
                  if (tick <= 0) return '0:00';
                  const minutes = Math.floor(tick / 60);
                  const seconds = tick % 60;
                  // Only show MM:SS if seconds is 0, otherwise show seconds
                  return seconds === 0 ? `${minutes}:00` : `${tick}s`;
                }
                return tick.toString();
              }}
            >
              <Label 
                value={yAxisLabel.charAt(0).toUpperCase() + yAxisLabel.slice(1)} 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} 
                offset={-5} 
              />
            </YAxis>
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
