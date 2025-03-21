
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
      // Fix: Don't use .single() which requires exactly one result
      const { data, error } = await supabase
        .from('friend_group_members')
        .update({ status: 'accepted' })
        .eq('id', invitationId)
        .select();
      
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
      // Fix: Don't use .single() which requires exactly one result
      const { data, error } = await supabase
        .from('friend_group_members')
        .update({ status: 'rejected' })
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
  
  // Add a manual trigger for refetching invitations, but don't use this in an interval
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
