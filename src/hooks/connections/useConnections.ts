
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
      console.log(`Fetching connections for player: ${currentPlayerId}`);
      
      if (!currentPlayerId) {
        console.log('No currentPlayerId provided, returning empty array');
        return [];
      }
      
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

      console.log(`Found ${connections.length} connections`);
      
      // Debug each connection to see what data we have
      connections.forEach(conn => {
        console.log(`Connection ${conn.id}: user_id=${conn.user_id}, friend_id=${conn.friend_id}, currentPlayer=${currentPlayerId}`);
        console.log('User profile:', conn.user);
        console.log('Friend profile:', conn.friend);
      });
      
      // Transform the data into the expected format
      const friendsList = connections.map(conn => {
        // Determine which profile to use based on the relationship direction
        const isUserInitiator = conn.user_id === currentPlayerId;
        const profileData = isUserInitiator ? conn.friend : conn.user;
        
        console.log(`Connection: ${conn.id}, isUserInitiator: ${isUserInitiator}, profileData:`, profileData);
        
        // Handle profile data safely
        const formattedProfile = profileData || {};
        
        if (!formattedProfile || (typeof formattedProfile === 'object' && Object.keys(formattedProfile).length === 0)) {
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
      
      // Log the final friends list
      console.log(`Processed ${friendsList.length} friends:`, friendsList.map(f => ({ id: f.id, name: f.name })));
      
      return friendsList;
    },
    enabled: enabled && !!currentPlayerId,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    refetchOnWindowFocus: false, // Only refetch when explicitly told to
    refetchOnMount: true, // Refetch on component mount to ensure fresh data
  });
};
