
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
        
        // Debug logging for better visibility into score data
        if (data && data.length > 0) {
          // Count by game for debugging
          const gameCounts = {};
          data.forEach(score => {
            gameCounts[score.game_id] = (gameCounts[score.game_id] || 0) + 1;
          });
          console.log('ALL scores by game type:', gameCounts);
          
          // Check today's scores specifically
          const today = new Date().toISOString().split('T')[0];
          const todayScores = data.filter(score => {
            const scoreDate = new Date(score.date).toISOString().split('T')[0];
            return scoreDate === today;
          });
          console.log(`ALL scores from today (${today}):`, todayScores.length);
          
          if (todayScores.length > 0) {
            console.log('Sample of today scores:', todayScores.slice(0, 3));
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
