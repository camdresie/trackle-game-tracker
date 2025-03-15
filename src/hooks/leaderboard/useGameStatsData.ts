
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { GameStatsWithProfile } from '@/types/leaderboard';

/**
 * Hook for fetching game stats data
 */
export const useGameStatsData = (
  userId: string | undefined,
  selectedGame: string,
  profilesData: any[] | undefined
) => {
  const { data: gameStatsData, isLoading: isLoadingGameStats } = useQuery({
    queryKey: ['game_stats', selectedGame],
    queryFn: async () => {
      try {
        console.log('Fetching game stats data for game:', selectedGame);
        
        let query = supabase
          .from('game_stats')
          .select('*, profiles:user_id(id, username, full_name, avatar_url)');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Game stats data retrieved:', data?.length || 0, 'records');
        
        // Transform the data to match our expected format
        const transformedData = data?.map(item => {
          const profileData = item.profiles;
          
          // Ensure we have a single profile object
          const profile = profileData || {
            id: item.user_id,
            username: 'Unknown',
            full_name: null,
            avatar_url: null
          };
          
          return {
            ...item,
            profiles: {
              id: profile.id || item.user_id,
              username: profile.username || 'Unknown',
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            }
          };
        });
        
        console.log('Transformed game stats with profiles:', transformedData?.length || 0);
        return transformedData as GameStatsWithProfile[];
      } catch (error) {
        console.error('Error fetching game stats data:', error);
        toast.error('Failed to load game statistics');
        return [];
      }
    },
    enabled: !!userId && !!profilesData
  });

  return { gameStatsData, isLoadingGameStats };
};
