
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
        // Perform a direct query to check for pending invitations first
        const checkQuery = `
          SELECT * FROM friend_group_members 
          WHERE friend_id = '${user.id}' 
          AND status = 'pending'
        `;
        
        const { data: directCheck, error: directCheckError } = await supabase.rpc('direct_sql_query', { sql_query: checkQuery });
        
        console.log('INVITATIONS QUERY - Direct check results:', directCheck);
        if (directCheckError) {
          console.error('INVITATIONS QUERY - Direct check error:', directCheckError);
        }
        
        // Get all pending invitations with group details using explicit join
        const { data, error } = await supabase
          .from('friend_group_members')
          .select(`
            id,
            group_id,
            friend_id,
            status,
            friend_groups:group_id(id, name, user_id)
          `)
          .eq('friend_id', user.id)
          .eq('status', 'pending');
        
        if (error) {
          console.error('INVITATIONS QUERY - Error fetching group invitations:', error);
          toast.error('Failed to load group invitations');
          return [];
        }
        
        // Log the raw data
        console.log('INVITATIONS QUERY - Raw group invitation data:', JSON.stringify(data, null, 2));
        console.log('INVITATIONS QUERY - Raw data type:', typeof data);
        console.log('INVITATIONS QUERY - Raw data length:', data?.length || 0);
        
        // If no invitations found
        if (!data || data.length === 0) {
          console.log('INVITATIONS QUERY - No pending invitations found for user:', user.id);
          
          // Try alternative query if the first one fails
          const { data: altData, error: altError } = await supabase
            .from('friend_group_members')
            .select('*')
            .eq('friend_id', user.id)
            .eq('status', 'pending');
            
          console.log('INVITATIONS QUERY - Alternative query results:', altData);
          
          if (altError || !altData || altData.length === 0) {
            return [];
          }
          
          // If we found invitations with the alternative query but not the first one,
          // there might be an issue with the join - process them manually
          const invitationsData: GroupInvitation[] = [];
          
          for (const item of altData) {
            // Get group details in a separate query
            const { data: groupData } = await supabase
              .from('friend_groups')
              .select('id, name, user_id')
              .eq('id', item.group_id)
              .single();
              
            if (groupData) {
              // Get group owner's username
              const { data: ownerData } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', groupData.user_id)
                .maybeSingle();
                
              invitationsData.push({
                id: item.id,
                groupId: groupData.id,
                groupName: groupData.name,
                groupOwner: ownerData?.username || 'Unknown User',
                status: item.status
              });
            }
          }
          
          return invitationsData;
        }
        
        // Format the invitations for display
        const invitationsData: GroupInvitation[] = [];
        
        // Process each invitation item
        for (const item of data) {
          console.log('INVITATIONS QUERY - Processing invitation item:', JSON.stringify(item, null, 2));
          
          // Check if the item has friend_groups data
          if (item.friend_groups) {
            // Get the group data - it could be an array or a single object
            const group = Array.isArray(item.friend_groups) 
              ? item.friend_groups[0] 
              : item.friend_groups;
              
            if (!group) {
              console.error('INVITATIONS QUERY - Missing group data in friend_groups');
              continue;
            }
            
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
        
        console.log('INVITATIONS QUERY - Formatted invitations found:', invitationsData.length);
        console.log('INVITATIONS QUERY - Final invitations data:', JSON.stringify(invitationsData, null, 2));
        return invitationsData;
      } catch (err) {
        console.error('INVITATIONS QUERY - Unexpected error in fetchInvitations:', err);
        toast.error('Error loading invitations');
        return [];
      }
    },
    enabled: !!user,
    // Increase refetch frequency for better responsiveness
    refetchInterval: 1500, // Even more frequent checks 
    staleTime: 0, // Always get fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 5
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
  
  // Add a manual trigger for refetching invitations
  const forceRefresh = async () => {
    console.log('INVITATIONS QUERY - Manually refreshing invitations');
    // Clear cache first
    queryClient.removeQueries({ queryKey: ['group-invitations'] });
    // Then refetch
    return await refetch();
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
