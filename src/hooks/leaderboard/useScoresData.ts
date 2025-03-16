
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Hook for fetching scores data
 */
export const useScoresData = (userId: string | undefined, selectedGame: string) => {
  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['scores', selectedGame, 'all-users'],
    queryFn: async () => {
      try {
        console.log('Fetching ALL scores data for game:', selectedGame);
        
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
        
        console.log('Scores data retrieved:', data?.length || 0, 'records');
        
        // Debug: log unique game_ids in score data to check for inconsistencies
        if (data && data.length > 0) {
          const gameIds = [...new Set(data.map(item => item.game_id))];
          console.log('Unique game IDs in scores data:', gameIds);
          
          // Count scores per game
          const gameCounts = gameIds.reduce((acc, gameId) => {
            acc[gameId] = data.filter(score => score.game_id === gameId).length;
            return acc;
          }, {} as Record<string, number>);
          
          console.log('Scores count per game:', gameCounts);
        }
        
        // Now separately get profiles for the user IDs
        const userIds = [...new Set(data?.map(item => item.user_id) || [])];
        let userProfiles: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
            
          if (profilesError) {
            console.error('Error fetching user profiles:', profilesError);
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
    enabled: !!selectedGame // This query should run as long as a game is selected
  });

  return { scoresData, isLoadingScores };
};
