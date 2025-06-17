import { useState } from 'react';
import { subDays, format } from 'date-fns';

export type DateRangeOption = '7d' | '30d' | '90d' | 'all';

export interface DateRangeConfig {
  label: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// Generate date range configs dynamically to ensure current dates
const generateDateRangeConfigs = (): Record<DateRangeOption, DateRangeConfig> => {
  const now = new Date();
  return {
    '7d': {
      label: 'Last 7 days',
      startDate: format(subDays(now, 7), 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
      limit: 50
    },
    '30d': {
      label: 'Last 30 days',
      startDate: format(subDays(now, 30), 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
      limit: 100
    },
    '90d': {
      label: 'Last 3 months',
      startDate: format(subDays(now, 90), 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
      limit: 200
    },
    'all': {
      label: 'All time'
      // No limit - fetch all scores for true all-time view
    }
  };
};

// Export the generated configs
export const dateRangeConfigs = generateDateRangeConfigs();

export const useChartDateRange = (defaultRange: DateRangeOption = '30d') => {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>(defaultRange);
  
  // Generate fresh configs each time to ensure current dates
  const freshDateRangeConfigs = generateDateRangeConfigs();
  const currentConfig = freshDateRangeConfigs[selectedRange];
  
  // Add debug logging for date ranges
  console.log(`[useChartDateRange] Selected range: ${selectedRange}`, {
    startDate: currentConfig.startDate,
    endDate: currentConfig.endDate,
    limit: currentConfig.limit
  });
  
  return {
    selectedRange,
    setSelectedRange,
    currentConfig,
    dateRangeConfigs: freshDateRangeConfigs
  };
};