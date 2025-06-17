import { useState } from 'react';
import { subDays, format } from 'date-fns';

export type DateRangeOption = '7d' | '30d' | '90d' | 'all';

export interface DateRangeConfig {
  label: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const dateRangeConfigs: Record<DateRangeOption, DateRangeConfig> = {
  '7d': {
    label: 'Last 7 days',
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    limit: 50
  },
  '30d': {
    label: 'Last 30 days',
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    limit: 100
  },
  '90d': {
    label: 'Last 3 months',
    startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    limit: 200
  },
  'all': {
    label: 'All time',
    limit: 500 // Maximum for performance
  }
};

export const useChartDateRange = (defaultRange: DateRangeOption = '30d') => {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>(defaultRange);
  
  const currentConfig = dateRangeConfigs[selectedRange];
  
  return {
    selectedRange,
    setSelectedRange,
    currentConfig,
    dateRangeConfigs
  };
};