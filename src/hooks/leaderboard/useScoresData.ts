
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Get the current date in Eastern Time (ET)
 * @returns Date string in YYYY-MM-DD format for Eastern Time
 */
const getEasternTimeDate = (): string => {
  // Create a date object for the current time
  const now = new Date();
  
  // Convert to Eastern Time (ET)
  // ET is UTC-5 (standard time) or UTC-4 (daylight saving)
  // For a simple implementation, we'll use a fixed offset
  const etOffsetHours = -5; // Eastern Standard Time offset from UTC
  
  // Calculate the time in milliseconds and adjust for ET
  const etTime = new Date(now.getTime() + etOffsetHours * 60 * 60 * 1000);
  
  // Format as YYYY-MM-DD
  return etTime.toISOString().split('T')[0];
};

/**
 * Convert a date to Eastern Time and return as YYYY-MM-DD format
 */
function convertToEasternTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Get the UTC time components
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  
  // Eastern Time offset is UTC-5 (standard time) or UTC-4 (daylight saving)
  // For simplicity, we'll use a fixed offset of -5 (EST)
  const etOffset = -5;
  
  // Create a new date object with the Eastern Time adjustment
  const etDate = new Date(Date.UTC(year, month, day, hours + etOffset, minutes));
  
  // Return the date part in YYYY-MM-DD format
  return etDate.toISOString().split('T')[0];
}

/**
 * Hook for fetching ALL scores data across users
 */
export const useScoresData = (userId: string | undefined, selectedGame: string) => {
  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['all-scores', selectedGame],
    queryFn: async () => {
      try {
        console.log('Fetching ALL scores data across users for game:', selectedGame);
        
        // Query to get all scores without filtering by user ID
        let query = supabase
          .from('scores')
          .select('*');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Retrieved ALL scores data:', data?.length || 0, 'records');
        
        // Get today's date in Eastern Time 
        const today = getEasternTimeDate();
        console.log('Today\'s date in Eastern Time (YYYY-MM-DD):', today);
        
        // Count today's scores to verify detection
        if (data && data.length > 0) {
          // Format date objects to Eastern Time YYYY-MM-DD strings for consistent comparison
          const formattedData = data.map(score => ({
            ...score,
            // Convert to Eastern Time
            formattedDate: convertToEasternTime(score.date)
          }));
          
          // For development purposes, also consider scores from the day before as "today"
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          // Check specifically for today's scores and yesterday's scores (for development)
          const todayScores = formattedData.filter(score => {
            const isToday = score.formattedDate === today;
            const isYesterday = score.formattedDate === yesterdayStr;
            
            if (isToday || isYesterday) {
              console.log('MATCH: Found a recent score:', {
                id: score.id,
                user_id: score.user_id,
                date: score.date,
                formattedDate: score.formattedDate,
                today: today,
                yesterday: yesterdayStr,
                value: score.value
              });
            }
            
            return isToday || isYesterday;
          });
          
          console.log(`useScoresData: Recent scores (${today} or ${yesterdayStr}):`, todayScores.length);
          if (todayScores.length > 0) {
            console.log('Sample recent scores:', todayScores.slice(0, 3));
          }
        }
        
        // Get profiles for all user IDs
        const userIds = [...new Set(data?.map(item => item.user_id) || [])];
        let userProfiles: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
            
          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
          } else {
            userProfiles = profiles || [];
            console.log('Retrieved profiles for scores:', userProfiles.length);
          }
        }
        
        // Map profile data to scores
        const transformedData = data?.map(item => {
          const profile = userProfiles.find(p => p.id === item.user_id) || {
            id: item.user_id,
            username: 'Unknown', 
            full_name: null,
            avatar_url: null
          };
          
          return {
            ...item,
            // Add a consistently formatted date in Eastern Time
            formattedDate: convertToEasternTime(item.date),
            user_profile: profile
          };
        });
        
        return transformedData || [];
      } catch (error) {
        console.error('Error fetching scores data:', error);
        toast.error('Failed to load score data');
        return [];
      }
    },
    enabled: true // Always fetch all scores data regardless of user ID
  });

  return { scoresData, isLoadingScores };
};
