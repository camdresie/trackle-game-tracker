import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, getDay, startOfWeek } from 'date-fns';
import { Score } from '@/utils/types';

interface ActivityData {
  date: string;
  count: number;
  scores: Score[];
}

interface ActivityHeatMapProps {
  data: ActivityData[];
}

export const ActivityHeatMap = ({ data }: ActivityHeatMapProps) => {
  const { weeks, maxCount } = useMemo(() => {
    const weekMap = new Map<string, ActivityData[]>();
    
    data.forEach(day => {
      const date = new Date(day.date);
      const weekStart = format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      if (!weekMap.has(weekStart)) {
        weekMap.set(weekStart, []);
      }
      weekMap.get(weekStart)!.push(day);
    });

    const weeks = Array.from(weekMap.values());
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return { weeks, maxCount };
  }, [data]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-secondary';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return 'bg-emerald-200 dark:bg-emerald-900';
    if (intensity < 0.5) return 'bg-emerald-400 dark:bg-emerald-700';
    if (intensity < 0.75) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-emerald-600 dark:bg-emerald-500';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <TooltipProvider>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1">
          <div className="flex flex-col gap-1 justify-around mr-2">
            {dayLabels.map((label, i) => (
              <div key={i} className="text-xs text-muted-foreground h-3 flex items-center">
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>
          
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayData = week.find(d => getDay(new Date(d.date)) === dayIndex);
                
                return (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 rounded-sm ${
                          dayData ? getColorClass(dayData.count) : 'bg-secondary/30'
                        } transition-colors hover:ring-2 hover:ring-primary`}
                      />
                    </TooltipTrigger>
                    {dayData && (
                      <TooltipContent>
                        <p className="font-medium">
                          {format(new Date(dayData.date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm">
                          {dayData.count} {dayData.count === 1 ? 'game' : 'games'}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-secondary" />
          <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
        </div>
        <span>More</span>
      </div>
    </TooltipProvider>
  );
};
