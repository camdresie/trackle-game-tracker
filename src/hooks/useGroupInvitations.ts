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
        // Fetch pending invitations. RLS lets the invitee read their own
        // membership rows and the groups they reference.
        // (friend_groups.user_id references auth.users, not profiles, so the
        // owner's profile can't be embedded here and is fetched separately.)
        const { data: rows, error: fetchError } = await supabase
          .from('friend_group_members')
          .select('id, group_id, status, friend_groups(name, user_id)')
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (fetchError) {
          console.error('Error fetching invitations:', fetchError);
          throw fetchError;
        }

        if (!rows || rows.length === 0) {
          return [];
        }

        // Fetch the owners' usernames (profiles are publicly readable).
        const ownerIds = [...new Set(rows.map((item: any) => item.friend_groups?.user_id).filter(Boolean))];
        const usernamesById: Record<string, string> = {};
        if (ownerIds.length > 0) {
          const { data: ownerProfiles, error: ownerError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', ownerIds);

          if (ownerError) {
            console.error('Error fetching group owner profiles:', ownerError);
          } else {
            ownerProfiles?.forEach(p => { usernamesById[p.id] = p.username; });
          }
        }

        // Format the invitations from the query results
        const invitationsData: GroupInvitation[] = rows.map((item: any) => ({
          id: item.id,
          groupId: item.group_id,
          groupName: item.friend_groups?.name || 'Unknown Group',
          groupOwner: usernamesById[item.friend_groups?.user_id] || 'Unknown User',
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

        // RLS lets the invitee update their own membership row to 'accepted'.
        const { data: updateResult, error: updateError } = await supabase
          .from('friend_group_members')
          .update({ status: 'accepted' })
          .eq('id', invitationId)
          .eq('friend_id', user.id)
          .select('id, status');

        if (updateError) {
          console.error('Error accepting invitation:', updateError);
          throw updateError;
        }

        if (!updateResult || updateResult.length === 0) {
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
