
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to fetch pending friend requests for a user
 */
export const useConnectionRequests = (playerId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['pending-requests', playerId],
    queryFn: async () => {
      // Log the current player ID for debugging
      console.log('Fetching pending requests for player:', playerId);
      
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          user_id,
          friend_id,
          user:profiles!connections_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('friend_id', playerId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending requests:', error);
        toast({
          title: "Error",
          description: "Failed to load friend requests",
          variant: "destructive"
        });
        return [];
      }
      
      // Log the raw data for debugging
      console.log('Raw pending requests data:', JSON.stringify(data, null, 2));

      return data.map(request => {
        // First, check what type of data we're getting
        console.log('Request user data type:', typeof request.user);
        console.log('Request user data:', request.user);
        
        // Properly extract the user data from the nested structure
        let userData = null;
        
        if (Array.isArray(request.user) && request.user.length > 0) {
          userData = request.user[0];
          console.log('Extracted user data from array:', userData);
        } else if (request.user && typeof request.user === 'object') {
          userData = request.user;
          console.log('Using user data directly:', userData);
        }
        
        return {
          id: request.id,
          playerId: request.user_id,
          friendId: request.friend_id,
          playerName: userData ? (userData.username || userData.full_name || 'Unknown User') : 'Unknown User',
          playerAvatar: userData ? userData.avatar_url : undefined
        };
      });
    },
    enabled: enabled && !!playerId
  });
};
