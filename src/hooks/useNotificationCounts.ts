import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationCounts {
  friendRequests: number;
  groupInvites: number;
  total: number;
}

interface GroupInviteResult {
  id: string;
  group_id: string;
  friend_id: string;
  status: string;
  group_name: string;
  owner_id: string;
  owner_username: string;
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

        // Get group invite count using the same query structure as useGroupInvitations
        const directQuery = `
          SELECT 
            fgm.id, 
            fgm.group_id, 
            fgm.friend_id,
            fgm.status,
            fg.name as group_name,
            fg.user_id as owner_id,
            p.username as owner_username
          FROM 
            friend_group_members fgm
          JOIN 
            friend_groups fg ON fgm.group_id = fg.id
          LEFT JOIN 
            profiles p ON fg.user_id = p.id
          WHERE 
            fgm.friend_id = '${user.id}' 
            AND fgm.status = 'pending'
        `;
        
        const { data: groupInvites, error: groupError } = await supabase.rpc('direct_sql_query', { 
          sql_query: directQuery 
        });

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