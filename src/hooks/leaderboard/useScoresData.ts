
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
          .select('*, profiles:user_id(id, username, full_name, avatar_url)');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Retrieved ALL scores data:', data?.length || 0, 'records');
        console.log('Raw scores from database:', data?.map(score => ({
          id: score.id,
          user_id: score.user_id,
          date: score.date,
          value: score.value
        })));
        
        // Get today's date in Eastern Time 
        const today = getEasternTimeDate();
        console.log('Today\'s date in Eastern Time (YYYY-MM-DD):', today);
        
        // Log all dates to debug
        const allDates = data?.map(item => item.date) || [];
        console.log('All dates in database:', allDates);
        console.log('Unique dates in database:', [...new Set(allDates)]);
        
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
        
        // Explicitly log any scores from today
        const todayScores = data?.filter(s => s.date === today) || [];
        console.log(`Database has ${todayScores.length} scores with date exactly matching today (${today}):`);
        if (todayScores.length > 0) {
          todayScores.forEach(s => {
            console.log(`Today's score in DB: ID ${s.id}, User ${s.user_id}, Date ${s.date}, Value ${s.value}`);
          });
        }
        
        // Map profile data to scores and determine if each score is from today
        const transformedData = data?.map(item => {
          const profile = userProfiles.find(p => p.id === item.user_id) || {
            id: item.user_id,
            username: 'Unknown', 
            full_name: null,
            avatar_url: null
          };
          
          // CRITICAL: Do a direct string comparison with the date
          // This is more reliable than date object comparison
          const isToday = item.date === today;
          
          if (isToday) {
            console.log(`TODAY'S SCORE FOUND in useScoresData: User ${profile.username}, ID: ${item.id}, Value: ${item.value}, DB Date: ${item.date}, Today: ${today}`);
          }
          
          return {
            ...item,
            formattedDate: item.date, // Date is already in YYYY-MM-DD format
            isToday,
            user_profile: profile
          };
        });
        
        // Count and log today's scores
        const todayTransformedScores = transformedData?.filter(score => score.isToday) || [];
        console.log(`useScoresData: Found ${todayTransformedScores.length} scores from today (${today})`);
        if (todayTransformedScores.length > 0) {
          console.log('All today\'s scores:', todayTransformedScores.map(s => ({
            id: s.id,
            user_id: s.user_id,
            username: s.user_profile?.username,
            date: s.date,
            formattedDate: s.formattedDate,
            isToday: s.isToday,
            value: s.value
          })));
        }
        
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
