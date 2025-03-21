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
        
        // Get groups where current user is owner
        const { data: ownedGroups, error: ownedError } = await supabase
          .from('friend_groups')
          .select('*')
          .eq('user_id', user.id);
          
        if (ownedError) {
          console.error('Error fetching owned groups:', ownedError);
          throw ownedError;
        }
        
        console.log('Owned groups:', ownedGroups?.length || 0);
        
        // Get groups where current user is a member (with accepted status)
        const { data: memberGroups, error: memberError } = await supabase
          .from('friend_group_members')
          .select('friend_groups(*)')
          .eq('friend_id', user.id)
          .eq('status', 'accepted');
          
        if (memberError) {
          console.error('Error fetching member groups:', memberError);
          throw memberError;
        }
        
        console.log('Member groups:', memberGroups?.length || 0);
        
        // Combine owned and member groups
        const groups: FriendGroup[] = [...(ownedGroups || [])];
        
        // Add member groups if they exist and aren't already included
        if (memberGroups) {
          memberGroups.forEach(item => {
            if (item.friend_groups) {
              // Convert the friend_groups to FriendGroup and mark as joined group
              const group = item.friend_groups as unknown as FriendGroup;
              group.isJoinedGroup = true;
              
              // Only add if not already in the list (to avoid duplicates)
              if (!groups.some(g => g.id === group.id)) {
                groups.push(group);
              }
            }
          });
        }
        
        console.log('Combined groups:', groups.length);
        return groups;
        
      } catch (error) {
        console.error('Error in useFriendGroups:', error);
        toast.error('Failed to load friend groups');
        return [];
      }
    },
    enabled: !!user && friends !== undefined
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
    },
    onError: (error) => {
      console.error('Error removing friend from group:', error);
      toast.error('Failed to remove friend from group');
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
    deleteGroup: deleteGroupMutation.mutate,
    refetch,
    refetchGroups: refetch // Alias for backward compatibility
  };
};
