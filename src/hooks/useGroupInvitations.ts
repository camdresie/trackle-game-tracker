import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  groupOwner: string;
  status: string;
}

interface DirectQueryResult {
  id: string;
  group_id: string;
  friend_id: string;
  status: string;
  group_name: string;
  owner_id: string;
  owner_username: string;
}

export const useGroupInvitations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  
  // Fetch all group invitations for the current user
  const {
    data: invitations = [],
    isLoading,
    refetch,
    isError
  } = useQuery({
    queryKey: ['social-data', 'group-invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // Use the direct_sql_query function to get pending invitations
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
        
        const { data: directResults, error: directQueryError } = await supabase.rpc('direct_sql_query', { 
          sql_query: directQuery 
        });
        
        if (directQueryError) {
          console.error('Error fetching invitations:', directQueryError);
          throw directQueryError;
        }
        
        if (!directResults || !Array.isArray(directResults) || directResults.length === 0) {
          return [];
        }
        
        // Format the invitations from the direct query results
        const invitationsData: GroupInvitation[] = (directResults as unknown as DirectQueryResult[]).map(item => ({
          id: item.id,
          groupId: item.group_id,
          groupName: item.group_name || 'Unknown Group',
          groupOwner: item.owner_username || 'Unknown User',
          status: item.status
        }));
        
        return invitationsData;
      } catch (err) {
        console.error('Error loading invitations:', err);
        toast.error('Error loading invitations');
        return [];
      }
    },
    enabled: !!user,
    // Reduced refetch intervals to prevent too many database calls
    refetchInterval: 30000, // Every 30 seconds
    staleTime: 15000, // Add a stale time of 15 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1 // Limit retries to reduce database calls
  });
  
  // Mark initial load as complete after first query
  useEffect(() => {
    if (!isLoading && !isInitialLoadComplete) {
      setIsInitialLoadComplete(true);
    }
  }, [isLoading, isInitialLoadComplete]);
  
  // Accept a group invitation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      try {
        // Find the invitation in our local state first
        const invitation = invitations.find(inv => inv.id === invitationId);
        
        if (!invitation) {
          console.error('Invitation not found in local state:', invitationId);
          throw new Error('Failed to find invitation');
        }
        
        const groupId = invitation.groupId;
        
        // Use RPC to ensure the update works reliably
        const updateQuery = `
          UPDATE friend_group_members 
          SET status = 'accepted' 
          WHERE id = '${invitationId}'
          RETURNING id, status
        `;
        
        const { data: updateResult, error: updateError } = await supabase.rpc('direct_sql_query', {
          sql_query: updateQuery
        });
        
        if (updateError) {
          console.error('Error accepting invitation:', updateError);
          throw updateError;
        }
        
        if (!updateResult || !Array.isArray(updateResult) || updateResult.length === 0) {
          console.error('No rows updated - invitation may not exist');
          throw new Error('Failed to update invitation - record may have been deleted');
        }
        
        return { invitationId, groupId };
      } catch (error) {
        console.error('Error in acceptInvitationMutation:', error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      // Clear all related caches
      queryClient.removeQueries({ queryKey: ['social-data'] });
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      queryClient.removeQueries({ queryKey: ['group-invitations'] });
      queryClient.removeQueries({ queryKey: ['notification-counts'] });
      queryClient.removeQueries({ queryKey: ['group-members'] });
      queryClient.removeQueries({ queryKey: ['member-profiles'] });
      
      // Force refetch all related data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['social-data'] }),
        queryClient.refetchQueries({ queryKey: ['friend-groups'] }),
        queryClient.refetchQueries({ queryKey: ['group-invitations'] }),
        queryClient.refetchQueries({ queryKey: ['notification-counts'] }),
        queryClient.refetchQueries({ queryKey: ['group-members'] }),
        queryClient.refetchQueries({ queryKey: ['member-profiles'] })
      ]);
      
      // Add a small delay and then refetch again to ensure everything is in sync
      setTimeout(async () => {
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['social-data'] }),
          queryClient.refetchQueries({ queryKey: ['friend-groups'] }),
          queryClient.refetchQueries({ queryKey: ['group-invitations'] }),
          queryClient.refetchQueries({ queryKey: ['notification-counts'] }),
          queryClient.refetchQueries({ queryKey: ['group-members'] }),
          queryClient.refetchQueries({ queryKey: ['member-profiles'] })
        ]);
      }, 1000);
      
      toast.success('You have joined the group!');
    },
    onError: (error) => {
      console.error('Error in acceptInvitationMutation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    }
  });
  
  // Decline a group invitation
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      // Actually delete the invitation instead of just updating status
      const { error } = await supabase
        .from('friend_group_members')
        .delete()
        .eq('id', invitationId);
      
      if (error) {
        console.error('Error declining invitation:', error);
        throw error;
      }
      
      return invitationId;
    },
    onSuccess: async () => {
      // Clear all related caches
      queryClient.removeQueries({ queryKey: ['social-data'] });
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      queryClient.removeQueries({ queryKey: ['group-invitations'] });
      queryClient.removeQueries({ queryKey: ['notification-counts'] });
      
      // Force refetch all related data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['social-data'] }),
        queryClient.refetchQueries({ queryKey: ['friend-groups'] }),
        queryClient.refetchQueries({ queryKey: ['group-invitations'] }),
        queryClient.refetchQueries({ queryKey: ['notification-counts'] })
      ]);
      
      toast.success('Group invitation declined');
    },
    onError: (error) => {
      console.error('Error in declineInvitationMutation:', error);
      toast.error('Failed to decline invitation');
    }
  });
  
  // Add a manual trigger for refetching invitations
  const forceRefresh = async () => {
    return await refetch();
  };
  
  return {
    invitations,
    isLoading: isLoading && !isInitialLoadComplete,
    isError,
    acceptInvitation: acceptInvitationMutation.mutate,
    declineInvitation: declineInvitationMutation.mutate,
    refetch,
    forceRefresh
  };
};
