import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type DateRangeOption, dateRangeConfigs } from '@/hooks/useChartDateRange';

interface ChartDateRangeSelectorProps {
  selectedRange: DateRangeOption;
  onRangeChange: (range: DateRangeOption) => void;
}

export const ChartDateRangeSelector = ({ 
  selectedRange, 
  onRangeChange 
}: ChartDateRangeSelectorProps) => {
  const currentConfig = dateRangeConfigs[selectedRange];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Calendar className="h-4 w-4 mr-2" />
          {currentConfig.label}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(dateRangeConfigs).map(([key, config]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onRangeChange(key as DateRangeOption)}
            className={selectedRange === key ? 'bg-accent' : ''}
          >
            {config.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};