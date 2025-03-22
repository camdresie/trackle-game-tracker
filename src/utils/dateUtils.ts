
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Get the current date in Eastern Time (ET) in YYYY-MM-DD format
 * This is the standard format used across the application for date comparisons
 * The day changes at midnight Eastern Time
 */
export const getTodayInEasternTime = (): string => {
  // Always use Eastern Time for consistent date handling across the application
  const easternTime = formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
  console.log("[dateUtils] Eastern timezone today's date:", easternTime);
  return easternTime;
};

/**
 * Check if a date string matches today's date in Eastern Time
 * This ensures all "today" checks are against midnight Eastern Time
 */
export const isToday = (dateString: string): boolean => {
  const today = getTodayInEasternTime();
  const result = dateString === today;
  
  // Debug log for checking date comparisons
  console.log(`[dateUtils] Comparing dates - Date: ${dateString}, Today: ${today}, Match: ${result}`);
  
  return result;
};
