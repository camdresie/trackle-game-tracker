
import { useState } from 'react';
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
  
  // Fetch all group invitations for the current user
  const {
    data: invitations = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['group-invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching group invitations for user:', user.id);
      
      // Get all friend_group_members entries where this user is the friend_id
      // and has NOT been processed yet by the user (they are pending invitations)
      const { data, error } = await supabase
        .from('friend_group_members')
        .select(`
          id,
          group_id,
          friend_id,
          status,
          friend_groups:friend_groups(id, name, user_id)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching group invitations:', error);
        toast.error('Failed to load group invitations');
        return [];
      }
      
      console.log('Raw group invitation data:', data);
      
      // Format the invitations for display
      const invitationsData: GroupInvitation[] = [];
      
      for (const item of data) {
        if (item.friend_groups) {
          const group = item.friend_groups as any;
          
          // Get group owner's username
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', group.user_id)
            .single();
          
          invitationsData.push({
            id: item.id,
            groupId: group.id,
            groupName: group.name,
            groupOwner: ownerData?.username || 'Unknown User',
            status: item.status
          });
        }
      }
      
      console.log('Formatted invitations found:', invitationsData);
      return invitationsData;
    },
    enabled: !!user
  });
  
  // Accept a group invitation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('Accepting invitation:', invitationId);
      
      const { data, error } = await supabase
        .from('friend_group_members')
        .update({ status: 'accepted' })
        .eq('id', invitationId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Group invitation accepted');
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      queryClient.invalidateQueries({ queryKey: ['friend-group-members'] });
    },
    onError: (error) => {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  });
  
  // Decline a group invitation
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('Declining invitation:', invitationId);
      
      const { data, error } = await supabase
        .from('friend_group_members')
        .delete()
        .eq('id', invitationId)
        .select();
      
      if (error) throw error;
      return invitationId;
    },
    onSuccess: () => {
      toast.success('Group invitation declined');
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
    },
    onError: (error) => {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    }
  });
  
  return {
    invitations,
    isLoading,
    acceptInvitation: acceptInvitationMutation.mutate,
    declineInvitation: declineInvitationMutation.mutate,
    refetch
  };
};
