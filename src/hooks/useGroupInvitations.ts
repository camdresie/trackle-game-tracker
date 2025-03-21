
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
    queryKey: ['group-invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('INVITATIONS QUERY - Fetching group invitations for user:', user.id);
      
      try {
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
          console.error('INVITATIONS QUERY - Error fetching group invitations:', error);
          toast.error('Failed to load group invitations');
          return [];
        }
        
        console.log('INVITATIONS QUERY - Raw group invitation data:', data);
        
        // If no invitations found
        if (!data || data.length === 0) {
          console.log('INVITATIONS QUERY - No pending invitations found for user:', user.id);
          return [];
        }
        
        // Format the invitations for display
        const invitationsData: GroupInvitation[] = [];
        
        for (const item of data) {
          if (item.friend_groups) {
            const group = item.friend_groups as any;
            
            console.log(`INVITATIONS QUERY - Processing group invitation: group=${group.name}, id=${item.id}`);
            
            // Get group owner's username
            const { data: ownerData, error: ownerError } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', group.user_id)
              .maybeSingle();
            
            if (ownerError) {
              console.error('INVITATIONS QUERY - Error fetching owner profile:', ownerError);
            }
            
            invitationsData.push({
              id: item.id,
              groupId: group.id,
              groupName: group.name,
              groupOwner: ownerData?.username || 'Unknown User',
              status: item.status
            });
            
            console.log(`INVITATIONS QUERY - Added invitation to result: groupName=${group.name}, id=${item.id}`);
          } else {
            console.error('INVITATIONS QUERY - Missing friend_groups data for item:', item);
          }
        }
        
        console.log('INVITATIONS QUERY - Formatted invitations found:', invitationsData);
        return invitationsData;
      } catch (err) {
        console.error('INVITATIONS QUERY - Unexpected error in fetchInvitations:', err);
        toast.error('Error loading invitations');
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 10000, // Refresh more frequently (every 10 seconds)
    staleTime: 2000, // Consider data stale after 2 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
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
  
  // Add a manual trigger for refetching invitations
  const forceRefresh = () => {
    console.log('INVITATIONS QUERY - Manually refreshing invitations');
    // Clear cache first
    queryClient.removeQueries({ queryKey: ['group-invitations'] });
    // Then refetch
    return refetch();
  };
  
  return {
    invitations,
    isLoading: isLoading && !isInitialLoadComplete, // Only show loading state on initial load
    isError,
    acceptInvitation: acceptInvitationMutation.mutate,
    declineInvitation: declineInvitationMutation.mutate,
    refetch,
    forceRefresh
  };
};
