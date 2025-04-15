
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Player } from '@/utils/types';

/**
 * Custom hook to get a user's connections (friends)
 * 
 * This hook fetches all connections where the user is either the sender or receiver,
 * and returns a list of friend profiles.
 */
export const useConnections = (userId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      
      // Get all connections where the user is either the requester or the receiver
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');
      
      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        throw connectionsError;
      }
      
      
      if (!connections || connections.length === 0) {
        return [];
      }
      
      // Extract friend IDs from connections (the ID that's not the user's)
      const friendIds = connections.map(conn => 
        conn.user_id === userId ? conn.friend_id : conn.user_id
      );
      
      
      // Fetch friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', friendIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      
      // Transform profiles into Player objects with proper null checks
      const friends: Player[] = (profiles || []).map(profile => {
        // Check that profile is not null and has necessary properties
        if (!profile) {
          console.warn('Received null profile in useConnections');
          return {
            id: 'unknown',
            name: 'Unknown User',
            avatar: null
          };
        }
        
        return {
          id: profile.id || 'unknown',
          name: profile.username || profile.full_name || 'Unknown User',
          avatar: profile.avatar_url
        };
      });
      
      
      return friends;
    },
    enabled: enabled && !!userId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false
  });
};
