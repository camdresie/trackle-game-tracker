import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Player } from '@/utils/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FriendGroup {
  id: string;
  name: string;
  user_id: string; // owner ID
  description?: string;
  created_at: string;
  updated_at: string;
  members?: Player[];
  pendingMembers?: Player[];
  pendingCount?: number;
  isJoinedGroup?: boolean;
  status?: 'pending' | 'accepted' | 'rejected';
}

export const useFriendGroups = (friends: Player[]) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get all friend groups where the current user is either owner or a member
  const { 
    data: friendGroups = [], 
    isLoading, 
    refetch
  } = useQuery({
    queryKey: ['friend-groups', user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];
        
        console.log('Fetching friend groups for user:', user.id);
        
        // More comprehensive SQL query using direct_sql_query
        const directQuery = `
          WITH owned_groups AS (
            SELECT 
              fg.id, 
              fg.name, 
              fg.description, 
              fg.user_id,
              fg.created_at, 
              fg.updated_at, 
              false as is_joined_group,
              'owner' as status
            FROM 
              friend_groups fg
            WHERE 
              fg.user_id = '${user.id}'
          ),
          member_groups AS (
            SELECT 
              fg.id, 
              fg.name, 
              fg.description, 
              fg.user_id,
              fg.created_at, 
              fg.updated_at, 
              true as is_joined_group,
              fgm.status
            FROM 
              friend_group_members fgm
            JOIN 
              friend_groups fg ON fgm.group_id = fg.id
            WHERE 
              fgm.friend_id = '${user.id}'
              AND fgm.status = 'accepted'
          )
          SELECT * FROM owned_groups
          UNION ALL
          SELECT * FROM member_groups
        `;
        
        const { data: directResults, error: directQueryError } = await supabase.rpc('direct_sql_query', { 
          sql_query: directQuery 
        });
        
        if (directQueryError) {
          console.error('Error fetching groups:', directQueryError);
          throw directQueryError;
        }
        
        console.log('Direct query friend groups results:', directResults);
        
        if (!directResults || directResults.length === 0) {
          return [];
        }
        
        // Format the groups from the direct query results
        const groupsData: FriendGroup[] = directResults.map(item => ({
          id: item.id,
          name: item.name,
          user_id: item.user_id,
          description: item.description,
          created_at: item.created_at,
          updated_at: item.updated_at,
          isJoinedGroup: item.is_joined_group,
          status: item.status
        }));
        
        // Fetch members for each group
        const enrichedGroups = await Promise.all(groupsData.map(async (group) => {
          try {
            // Get all accepted members (active members)
            const { data: memberRecords, error: membersError } = await supabase
              .from('friend_group_members')
              .select(`
                id,
                friend_id,
                status
              `)
              .eq('group_id', group.id)
              .eq('status', 'accepted');
              
            if (membersError) {
              console.error(`Error fetching members for group ${group.id}:`, membersError);
              throw membersError;
            }
            
            // Get profiles for accepted members
            const memberIds = memberRecords?.map(m => m.friend_id) || [];
            
            // Always add the group creator to memberIds if not already included
            if (!memberIds.includes(group.user_id)) {
              memberIds.push(group.user_id);
            }
            
            let acceptedMembers: Player[] = [];
            
            if (memberIds.length > 0) {
              const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', memberIds);
                
              if (profilesError) {
                console.error(`Error fetching profiles for group ${group.id}:`, profilesError);
                throw profilesError;
              }
              
              // Format members into Player objects
              acceptedMembers = (profilesData || []).map(profile => ({
                id: profile.id,
                name: profile.username || profile.full_name || 'Unknown User',
                avatar: profile.avatar_url,
                status: 'accepted'
              }));
            }

            // Get pending invitations - only needed for groups where user is owner
            let pendingMembers: Player[] = [];
            let pendingCount = 0;
            
            if (!group.isJoinedGroup) {
              const { data: pendingRecords, error: pendingError } = await supabase
                .from('friend_group_members')
                .select(`
                  id,
                  friend_id,
                  status
                `)
                .eq('group_id', group.id)
                .eq('status', 'pending');
                
              if (pendingError) {
                console.error(`Error fetching pending invites for group ${group.id}:`, pendingError);
                throw pendingError;
              }
              
              // Get profiles for pending members
              const pendingIds = pendingRecords?.map(m => m.friend_id) || [];
              pendingCount = pendingIds.length;
              
              if (pendingIds.length > 0) {
                const { data: pendingProfilesData, error: pendingProfilesError } = await supabase
                  .from('profiles')
                  .select('id, username, full_name, avatar_url')
                  .in('id', pendingIds);
                  
                if (pendingProfilesError) {
                  console.error(`Error fetching profiles for pending invites in group ${group.id}:`, pendingProfilesError);
                  throw pendingProfilesError;
                }
                
                // Format pending members into Player objects
                pendingMembers = (pendingProfilesData || []).map(profile => ({
                  id: profile.id,
                  name: profile.username || profile.full_name || 'Unknown User',
                  avatar: profile.avatar_url,
                  status: 'pending'
                }));
              }
            }
            
            console.log(`Group ${group.name} has ${acceptedMembers.length} accepted members and ${pendingMembers.length} pending invites`);
            
            return {
              ...group,
              members: acceptedMembers,
              pendingMembers: pendingMembers,
              pendingCount: pendingCount
            };
          } catch (err) {
            console.error(`Error processing members for group ${group.id}:`, err);
            return {
              ...group,
              members: [],
              pendingMembers: [],
              pendingCount: 0
            };
          }
        }));
        
        console.log('Enriched groups with members:', enrichedGroups);
        return enrichedGroups;
      } catch (error) {
        console.error('Error in useFriendGroups:', error);
        toast.error('Failed to load friend groups');
        return [];
      }
    },
    enabled: !!user && friends !== undefined,
    staleTime: 5000, // Shorter stale time to refresh more frequently
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnMount: true // Always refetch when component mounts
  });
  
  // Create a new friend group
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string, description?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('friend_groups')
        .insert({
          name,
          description,
          user_id: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Friend group created successfully');
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
    },
    onError: (error) => {
      console.error('Error creating friend group:', error);
      toast.error('Failed to create friend group');
    }
  });

  // Update an existing friend group
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string, name: string, description?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('friend_groups')
        .update({
          name,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user owns the group
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Friend group updated successfully');
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
    },
    onError: (error) => {
      console.error('Error updating friend group:', error);
      toast.error('Failed to update friend group');
    }
  });
  
  // Add a friend to a group
  const addFriendToGroupMutation = useMutation({
    mutationFn: async ({ 
      groupId, 
      friendId 
    }: { 
      groupId: string, 
      friendId: string 
    }) => {
      console.log(`ADDING FRIEND TO GROUP - Started: friendId=${friendId}, groupId=${groupId}`);
      
      // First, check if the group exists
      const { data: groupData, error: groupError } = await supabase
        .from('friend_groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();
      
      if (groupError || !groupData) {
        console.error('Error verifying group exists:', groupError || 'Group not found');
        throw new Error(groupError?.message || 'Group not found');
      }
      
      console.log(`ADDING FRIEND TO GROUP - Group verified: ${groupData.name}`);
      
      // Check if the friend exists
      const { data: friendData, error: friendError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', friendId)
        .maybeSingle();
      
      if (friendError || !friendData) {
        console.error('Error verifying friend exists:', friendError || 'Friend not found');
        throw new Error(friendError?.message || 'Friend not found');
      }
      
      console.log(`ADDING FRIEND TO GROUP - Friend verified: ${friendData.username || friendId}`);
      
      // Check if the friend is already in the group
      const { data: existingMember, error: checkError } = await supabase
        .from('friend_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('friend_id', friendId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking if friend is in group:', checkError);
        throw checkError;
      }
      
      // If already a member, check status and provide appropriate feedback
      if (existingMember) {
        console.log('Friend is already in this group:', existingMember);
        
        if (existingMember.status === 'pending') {
          throw new Error('Invitation already sent and pending response');
        } else if (existingMember.status === 'accepted') {
          throw new Error('Friend is already a member of this group');
        }
        
        return existingMember;
      }
      
      // Otherwise, add them as pending
      console.log(`ADDING FRIEND TO GROUP - About to insert: groupId=${groupId}, friendId=${friendId}`);
      
      const { data, error } = await supabase
        .from('friend_group_members')
        .insert({
          group_id: groupId,
          friend_id: friendId,
          status: 'pending' // Add as pending until they accept
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding friend to group:', error);
        throw error;
      }
      
      console.log('ADDING FRIEND TO GROUP - Success! New member record:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Friend invitation sent');
      console.log('Invitation successfully sent, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['friend-group-members'] });
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
    },
    onError: (error) => {
      console.error('Error in addFriendToGroupMutation:', error);
      
      // Provide more specific error messages based on the error
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to add friend to group';
      
      // Show different toast for 'already invited' error
      if (errorMessage.includes('already')) {
        toast.info(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  });
  
  // Remove a friend from a group
  const removeFriendFromGroupMutation = useMutation({
    mutationFn: async ({ groupId, friendId }: { groupId: string, friendId: string }) => {
      const { data, error } = await supabase
        .from('friend_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('friend_id', friendId);
      
      if (error) throw error;
      return { groupId, friendId };
    },
    onSuccess: () => {
      toast.success('Friend removed from group');
      queryClient.invalidateQueries({ queryKey: ['friend-group-members'] });
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
    },
    onError: (error) => {
      console.error('Error removing friend from group:', error);
      toast.error('Failed to remove friend from group');
    }
  });
  
  // Leave a group (for members who have joined a group)
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log(`Leaving group: ${groupId}, user: ${user.id}`);
      
      try {
        // Check if we have a member record directly first
        console.log(`Checking for member record for group ${groupId} and user ${user.id}`);
        const { data: memberRecords, error: memberError } = await supabase
          .from('friend_group_members')
          .select('*')
          .eq('group_id', groupId)
          .eq('friend_id', user.id);
        
        if (memberError) {
          console.error('Error finding member records:', memberError);
          throw new Error(`Failed to check membership: ${memberError.message}`);
        }
        
        console.log(`Found ${memberRecords?.length || 0} member records:`, memberRecords);
        
        if (!memberRecords || memberRecords.length === 0) {
          throw new Error('You are not a member of this group or have already left');
        }
        
        // Delete all matching member records
        console.log(`Deleting ${memberRecords.length} membership records`);
        const recordIds = memberRecords.map(record => record.id);
        
        const { error: deleteError } = await supabase
          .from('friend_group_members')
          .delete()
          .in('id', recordIds);
        
        if (deleteError) {
          console.error('Error deleting member records:', deleteError);
          throw new Error(`Failed to leave group: ${deleteError.message}`);
        }
        
        console.log(`Successfully left group: ${groupId}`);
        return { groupId };
      } catch (error) {
        console.error('Error in leaveGroup:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('You have left the friend group');
      // Force invalidate and refetch to update the UI
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      console.error('Error leaving friend group:', error);
      
      // Provide a more user-friendly error message
      let errorMessage = 'Failed to leave friend group';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // If they're not a member, we can consider this "successful" from the user's perspective
        if (errorMessage.includes('not a member') || errorMessage.includes('already left')) {
          toast.info('You are not currently a member of this group');
          
          // Trigger a refresh to update the UI
          queryClient.removeQueries({ queryKey: ['friend-groups'] });
          queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
          setTimeout(() => {
            refetch();
          }, 500);
          return;
        }
      }
      
      toast.error(errorMessage);
    }
  });
  
  // Delete a friend group
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // First delete all group members
      const { error: membersError } = await supabase
        .from('friend_group_members')
        .delete()
        .eq('group_id', groupId);
      
      if (membersError) throw membersError;
      
      // Then delete the group itself
      const { data, error } = await supabase
        .from('friend_groups')
        .delete()
        .eq('id', groupId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Friend group deleted');
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
    },
    onError: (error) => {
      console.error('Error deleting friend group:', error);
      toast.error('Failed to delete friend group');
    }
  });
  
  return {
    friendGroups,
    isLoading,
    createGroup: createGroupMutation.mutate,
    updateGroup: updateGroupMutation.mutate,
    addFriendToGroup: addFriendToGroupMutation.mutate,
    removeFriendFromGroup: removeFriendFromGroupMutation.mutate,
    leaveGroup: leaveGroupMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    refetch,
    refetchGroups: refetch // Alias for backward compatibility
  };
};
