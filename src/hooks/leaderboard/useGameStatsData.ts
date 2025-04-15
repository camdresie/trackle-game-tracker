
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
        
        let query = supabase
          .from('game_stats')
          .select('*, profiles:user_id(id, username, full_name, avatar_url)');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        
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

// Helper function to get user rank based on total games played
export const getUserRankByGamesPlayed = (
  gameStatsData: GameStatsWithProfile[] | undefined,
  userId: string
): { rank: number, totalUsers: number, label: string } => {
  if (!gameStatsData || gameStatsData.length === 0) {
    return { rank: 1, totalUsers: 1, label: 'Most Games Played' };
  }

  // First, we need to aggregate the total_plays for each user across all games
  const userTotalPlays = new Map<string, number>();
  
  // Calculate total plays for each user
  gameStatsData.forEach(stat => {
    const currentUserId = stat.user_id;
    const currentTotalPlays = stat.total_plays || 0;
    
    if (userTotalPlays.has(currentUserId)) {
      userTotalPlays.set(currentUserId, userTotalPlays.get(currentUserId)! + currentTotalPlays);
    } else {
      userTotalPlays.set(currentUserId, currentTotalPlays);
    }
  });
  
  // Convert to array and sort by total plays (descending)
  const sortedUsers = Array.from(userTotalPlays.entries())
    .sort((a, b) => b[1] - a[1]);
  
  // Find the user's rank
  const userIndex = sortedUsers.findIndex(([id]) => id === userId);
  const rank = userIndex !== -1 ? userIndex + 1 : sortedUsers.length;
  
  return { 
    rank, 
    totalUsers: sortedUsers.length,
    label: 'Most Games Played'
  };
};
