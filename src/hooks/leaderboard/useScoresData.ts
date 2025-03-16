
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { addDays, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Get the current date in Eastern Time (ET)
 * @returns Date string in YYYY-MM-DD format for Eastern Time
 */
const getEasternTimeDate = (): string => {
  return formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
};

/**
 * Convert a date to Eastern Time and return as YYYY-MM-DD format
 */
function convertToEasternTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return formatInTimeZone(date, 'America/New_York', 'yyyy-MM-dd');
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
        
        // Log all raw scores for debugging
        console.log('All raw scores:', data?.map(s => ({ 
          id: s.id, 
          user_id: s.user_id, 
          date: s.date, 
          et_date: convertToEasternTime(s.date) 
        })));
        
        // Count today's scores to verify detection
        if (data && data.length > 0) {
          // Format date objects to Eastern Time YYYY-MM-DD strings for consistent comparison
          const formattedData = data.map(score => ({
            ...score,
            // Convert to Eastern Time
            formattedDate: convertToEasternTime(score.date)
          }));
          
          // Check for today's scores
          const todayScores = formattedData.filter(score => {
            const isToday = score.formattedDate === today;
            
            if (isToday) {
              console.log('MATCH: Found TODAY score:', {
                id: score.id,
                user_id: score.user_id,
                date: score.date,
                formattedDate: score.formattedDate,
                today: today,
                value: score.value
              });
            }
            
            return isToday;
          });
          
          console.log(`useScoresData: Found ${todayScores.length} scores from today (${today})`);
          if (todayScores.length > 0) {
            console.log('All today\'s scores:', todayScores.map(s => ({
              id: s.id,
              user_id: s.user_id,
              date: s.date,
              formattedDate: s.formattedDate,
              value: s.value
            })));
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
