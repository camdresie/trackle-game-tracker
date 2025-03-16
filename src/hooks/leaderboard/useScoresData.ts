
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Get the current date in Eastern Time (ET)
 * @returns Date string in YYYY-MM-DD format for Eastern Time
 */
const getEasternTimeDate = (): string => {
  return formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
};

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
        
        // Get today's date in Eastern Time 
        const today = getEasternTimeDate();
        console.log('Today\'s date in Eastern Time (YYYY-MM-DD):', today);
        
        // Log all dates to debug
        const allDates = data?.map(item => item.date) || [];
        console.log('All dates in database:', allDates);
        
        // Log all dates and user IDs for better debugging
        data?.forEach(item => {
          console.log(`Score ID: ${item.id}, User ID: ${item.user_id}, Date: ${item.date}`);
        });
        
        // Explicitly log any scores with today's date
        const todayScores = data?.filter(s => s.date === today) || [];
        console.log(`Found ${todayScores.length} scores with today's date (${today}):`);
        if (todayScores.length > 0) {
          todayScores.forEach(s => {
            console.log(`Today's score: ID ${s.id}, User ${s.user_id}, Date ${s.date}, Value ${s.value}`);
          });
        }
        
        // Transform and mark today's scores
        const transformedData = data?.map(item => {
          // Mark if score is from today
          const isToday = item.date === today;
          
          if (isToday) {
            console.log(`Marking score ${item.id} as today's score for user ${item.user_id}`);
          }
          
          return {
            ...item,
            isToday,
            formattedDate: item.date
          };
        }) || [];
        
        return transformedData;
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
