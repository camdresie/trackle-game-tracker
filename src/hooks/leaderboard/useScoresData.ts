
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
        
        // Get today's date in YYYY-MM-DD format for consistent comparison
        const today = new Date().toISOString().split('T')[0];
        console.log('Today\'s date for filtering (YYYY-MM-DD):', today);
        
        // Count today's scores to verify detection
        if (data && data.length > 0) {
          // Format date objects to YYYY-MM-DD strings for consistent comparison
          const formattedData = data.map(score => ({
            ...score,
            // Ensure date is in the correct format
            formattedDate: typeof score.date === 'string' 
              ? score.date.split('T')[0]  // Handle ISO strings
              : new Date(score.date).toISOString().split('T')[0] // Handle Date objects
          }));
          
          // For development purposes, also consider scores from the day before as "today"
          const yesterday = new Date();
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
            // Add a consistently formatted date for easier filtering
            formattedDate: typeof item.date === 'string' 
              ? item.date.split('T')[0]
              : new Date(item.date).toISOString().split('T')[0],
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
