
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Player } from '@/utils/types';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to fetch a user's connections (friends)
 */
export const useConnections = (currentPlayerId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['friends', currentPlayerId],
    queryFn: async () => {
      console.log('Fetching friends for user:', currentPlayerId);
      
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          user_id,
          friend_id,
          friend:profiles!connections_friend_id_fkey(id, username, full_name, avatar_url),
          user:profiles!connections_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${currentPlayerId},friend_id.eq.${currentPlayerId}`)
        .order('id', { ascending: false });
      
      if (error) {
        console.error('Error fetching friends:', error);
        toast({
          title: "Error",
          description: "Failed to load friends",
          variant: "destructive"
        });
        return [];
      }

      // Transform the data into the expected format
      return connections.map(conn => {
        // Determine which profile to use based on the relationship direction
        const isUserInitiator = conn.user_id === currentPlayerId;
        const profileData = isUserInitiator ? conn.friend : conn.user;
        
        // Handle profile data safely
        let formattedProfile = null;
        
        if (Array.isArray(profileData) && profileData.length > 0) {
          formattedProfile = profileData[0];
        } else if (profileData && typeof profileData === 'object') {
          formattedProfile = profileData;
        }
        
        if (!formattedProfile) {
          console.error('Profile data missing in connection:', conn);
          return null;
        }
        
        return {
          id: formattedProfile.id,
          name: formattedProfile.username || formattedProfile.full_name || 'Unknown User',
          avatar: formattedProfile.avatar_url,
          connectionId: conn.id, // Include connectionId for removal
        } as Player;
      }).filter(Boolean) as Player[];
    },
    enabled: enabled && !!currentPlayerId,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    refetchOnWindowFocus: false, // Only refetch when explicitly told to
    refetchOnMount: false, // Don't refetch on component mount
  });
};
