
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
      
      try {
        console.log('Fetching invitations for user:', user.id);
        
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
        
        console.log('Invitations query results:', directResults);
        
        if (!directResults || directResults.length === 0) {
          return [];
        }
        
        // Format the invitations from the direct query results
        const invitationsData: GroupInvitation[] = directResults.map(item => ({
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
    refetchInterval: 30000, // Now every 30 seconds instead of 1 second
    staleTime: 15000, // Add a stale time of 15 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
      console.log('Accepting invitation with ID:', invitationId);
      
      try {
        // Find the invitation in our local state first
        const invitation = invitations.find(inv => inv.id === invitationId);
        
        if (!invitation) {
          console.error('Invitation not found in local state:', invitationId);
          throw new Error('Failed to find invitation');
        }
        
        const groupId = invitation.groupId;
        console.log('Found group ID for invitation:', groupId);
        
        // FIXED: Direct update using the friend_group_members table
        const { error: updateError } = await supabase
          .from('friend_group_members')
          .update({ status: 'accepted' })
          .eq('id', invitationId)
          .select();
        
        if (updateError) {
          console.error('Error accepting invitation:', updateError);
          throw updateError;
        }
        
        // Verify the update was successful - This is critical for confirmation
        const { data: verifyUpdate, error: verifyError } = await supabase
          .from('friend_group_members')
          .select('status')
          .eq('id', invitationId)
          .single();
          
        if (verifyError) {
          console.error('Error verifying invitation update:', verifyError);
          throw new Error('Could not verify invitation update');
        }
        
        if (!verifyUpdate || verifyUpdate.status !== 'accepted') {
          console.error('Verification failed - invitation status not updated correctly');
          throw new Error('Failed to update invitation status');
        }
        
        console.log('Successfully accepted invitation, verified status:', verifyUpdate.status);
        
        return { invitationId, groupId };
      } catch (error) {
        console.error('Error in acceptInvitationMutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Invitation accepted successfully, invalidating queries');
      
      // Aggressive cache invalidation
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      queryClient.invalidateQueries({ queryKey: ['friend-group-members'] });
      queryClient.removeQueries({ queryKey: ['group-invitations', user?.id] });
      
      // Force refetch after a short delay to ensure DB has updated
      setTimeout(() => {
        refetch();
      }, 500);
      
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
      console.log('Declining invitation with ID:', invitationId);
      
      // Actually delete the invitation instead of just updating status
      const { error } = await supabase
        .from('friend_group_members')
        .delete()
        .eq('id', invitationId);
      
      if (error) {
        console.error('Error declining invitation:', error);
        throw error;
      }
      
      console.log('Successfully declined invitation');
      return invitationId;
    },
    onSuccess: () => {
      console.log('Invitation declined successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
      toast.success('Group invitation declined');
    },
    onError: (error) => {
      console.error('Error in declineInvitationMutation:', error);
      toast.error('Failed to decline invitation');
    }
  });
  
  // Add a manual trigger for refetching invitations
  const forceRefresh = async () => {
    console.log('Force refreshing invitations');
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
