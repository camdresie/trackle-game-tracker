import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationCounts {
  friendRequests: number;
  groupInvites: number;
  total: number;
}

export const useNotificationCounts = () => {
  const { user } = useAuth();

  return useQuery<NotificationCounts>({
    queryKey: ['notification-counts'],
    queryFn: async () => {
      if (!user) {
        return { friendRequests: 0, groupInvites: 0, total: 0 };
      }

      try {
        // Get friend request count
        const { data: friendRequests, error: friendError } = await supabase
          .from('connections')
          .select('*')
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (friendError) {
          throw friendError;
        }

        // Get pending group invite count. RLS lets a user read their own
        // membership rows, so a direct query on friend_group_members suffices.
        const { data: groupInvites, error: groupError } = await supabase
          .from('friend_group_members')
          .select('id')
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (groupError) {
          throw groupError;
        }

        const friendRequestsCount = friendRequests?.length || 0;
        const groupInvitesCount = Array.isArray(groupInvites) ? groupInvites.length : 0;

        return {
          friendRequests: friendRequestsCount,
          groupInvites: groupInvitesCount,
          total: friendRequestsCount + groupInvitesCount
        };
      } catch (error) {
        console.error('Error fetching notification counts:', error);
        return { friendRequests: 0, groupInvites: 0, total: 0 };
      }
    },
    enabled: !!user,
    refetchInterval: 10000, // Refetch every 10 seconds instead of 30
    staleTime: 5000, // Consider data stale after 5 seconds instead of 15
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true // Refetch when network reconnects
  });
}; 