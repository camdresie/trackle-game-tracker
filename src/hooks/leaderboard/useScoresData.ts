
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
        if (data && data.length > 0) {
          console.log('All scores retrieved:', data.map(item => ({
            id: item.id,
            user_id: item.user_id,
            username: item.profiles?.username,
            date: item.date,
            value: item.value
          })));
        }
        
        // Transform and mark today's scores
        const transformedData = data?.map(item => {
          // Use simple string comparison to check if the score's date matches today's date
          const isToday = item.date === today;
          
          if (isToday) {
            console.log(`Found today's score: ID ${item.id}, User ${item.user_id}, Username: ${item.profiles?.username}, Date ${item.date}, Value ${item.value}`);
          }
          
          return {
            ...item,
            isToday,
            formattedDate: item.date
          };
        }) || [];
        
        // Count and log today's scores
        const todayScoresCount = transformedData.filter(item => item.isToday).length;
        console.log(`Total scores marked as today: ${todayScoresCount}`);
        
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
