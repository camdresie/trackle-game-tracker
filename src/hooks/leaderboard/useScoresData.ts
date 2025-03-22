
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Get the current date in Eastern Time (ET)
 * @returns Date string in YYYY-MM-DD format for Eastern Time
 */
const getEasternTimeDate = (): string => {
  // Always use Eastern Time for consistent date handling across the application
  const easternTime = formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
  console.log("Eastern timezone today's date:", easternTime);
  return easternTime;
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
        
        // Create base query
        let query = supabase.from('scores').select('*');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data: scoresData, error: scoresError } = await query;
            
        if (scoresError) throw scoresError;
        
        console.log('Retrieved scores data:', scoresData?.length || 0, 'records');
        
        // If we have scores, fetch the matching profiles in a separate query
        if (scoresData && scoresData.length > 0) {
          // Get unique user IDs from scores
          const userIds = [...new Set(scoresData.map(score => score.user_id))];
          
          // Fetch profiles for these users
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
            
          if (profilesError) throw profilesError;
          
          console.log('Retrieved profiles data for scores:', profilesData?.length || 0);
          
          // Create a map of profiles by ID for quick lookup
          const profilesMap = new Map();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
          
          // Get today's date in Eastern Time for consistent comparison
          const today = getEasternTimeDate();
          console.log('Today\'s date (ET/YYYY-MM-DD) for comparison:', today);
          
          // Transform and combine the data
          const transformedData = scoresData.map(item => {
            // Debug log each score's date
            console.log(`Score ID ${item.id}, Date: ${item.date}, Today: ${today}`);
            
            // Use simple string comparison to check if the score's date matches today's date
            const isToday = item.date === today;
            
            if (isToday) {
              console.log(`Found today's score: ID ${item.id}, User ${item.user_id}, Date ${item.date}, Value ${item.value}`);
            }
            
            // Get the matching profile
            const profile = profilesMap.get(item.user_id);
            
            return {
              ...item,
              isToday,
              formattedDate: item.date,
              profiles: profile || null
            };
          });
          
          // Count and log today's scores
          const todayScoresCount = transformedData.filter(item => item.isToday).length;
          console.log(`Total scores marked as today: ${todayScoresCount}`);
          
          return transformedData;
        }
        
        return [];
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
