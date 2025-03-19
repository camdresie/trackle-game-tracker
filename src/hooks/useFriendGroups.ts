
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { FriendGroup, Player } from '@/utils/types';

// Define a type for the join result from the friend_group_members query
interface GroupMemberJoinResult {
  group_id: string;
  friend_groups: {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
  } | null;
}

export const useFriendGroups = (friendsList: Player[] = []) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch friend groups - both created by the user and where the user is a member
  const { 
    data: friendGroups = [], 
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useQuery({
    queryKey: ['friend-groups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching groups for user:', user.id);
      
      // First get groups created by the user
      const { data: ownedGroups, error: ownedGroupsError } = await supabase
        .from('friend_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (ownedGroupsError) {
        console.error('Error fetching owned friend groups:', ownedGroupsError);
        toast.error('Failed to load your groups');
        return [];
      }
      
      console.log('Owned groups:', ownedGroups);
      
      // Then get groups where the user is a member (added by friends)
      const { data: memberGroups, error: memberGroupsError } = await supabase
        .from('friend_group_members')
        .select(`
          group_id,
          friend_groups:friend_groups(
            id, 
            user_id, 
            name, 
            description, 
            created_at, 
            updated_at
          )
        `)
        .eq('friend_id', user.id);
      
      if (memberGroupsError) {
        console.error('Error fetching member friend groups:', memberGroupsError);
        toast.error('Failed to load groups you are added to');
        return ownedGroups || [];
      }
      
      console.log('Member groups raw data:', memberGroups);
      
      // Extract the actual group data from memberGroups and add a flag to indicate it's a joined group
      const groupsAddedTo = memberGroups
        .filter(item => item.friend_groups !== null) // Filter out any null entries
        .map(item => {
          if (item.friend_groups) {
            return {
              ...item.friend_groups,
              isJoinedGroup: true
            };
          }
          return null;
        })
        .filter((group): group is FriendGroup & { isJoinedGroup: boolean } => group !== null);
      
      console.log('Groups user was added to:', groupsAddedTo);
      
      // Combine both sets of groups, ensuring no duplicates
      const allGroups = [...(ownedGroups || [])];
      
      // Add groups the user was added to, avoiding duplicates
      groupsAddedTo.forEach(joinedGroup => {
        // Verify the object has all the required FriendGroup properties
        if (
          'id' in joinedGroup && 
          'user_id' in joinedGroup && 
          'name' in joinedGroup && 
          'created_at' in joinedGroup && 
          'updated_at' in joinedGroup
        ) {
          if (!allGroups.some(group => group.id === joinedGroup.id)) {
            allGroups.push(joinedGroup);
          }
        } else {
          console.warn('Skipping invalid group object:', joinedGroup);
        }
      });
      
      // Sort combined groups by creation date
      const sortedGroups = allGroups.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) as FriendGroup[];
      
      console.log('All groups combined:', sortedGroups);
      
      return sortedGroups;
    },
    enabled: !!user
  });
  
  // Fetch members for all groups
  const { 
    data: groupsWithMembers = [],
    isLoading: isLoadingMembers
  } = useQuery({
    queryKey: ['friend-group-members', user?.id, friendGroups],
    queryFn: async () => {
      if (!user || friendGroups.length === 0) return [];
      
      const groupsWithMembersPromises = friendGroups.map(async (group) => {
        console.log(`Fetching members for group ${group.id}`);
        
        const { data, error } = await supabase
          .from('friend_group_members')
          .select('*')
          .eq('group_id', group.id);
        
        if (error) {
          console.error(`Error fetching members for group ${group.id}:`, error);
          return { ...group, members: [] };
        }
        
        console.log(`Members data for group ${group.id}:`, data);
        
        // Map members from friend IDs to Player objects
        const members = data.map(memberData => {
          const friend = friendsList.find(f => f.id === memberData.friend_id);
          return friend || {
            id: memberData.friend_id,
            name: 'Unknown Friend',
          };
        });
        
        // For groups the user was added to, make sure to include the group owner
        if (group.isJoinedGroup) {
          console.log(`Getting owner for joined group ${group.id}, owner ID: ${group.user_id}`);
          
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', group.user_id)
            .maybeSingle();
            
          if (ownerData && !members.some(m => m.id === ownerData.id)) {
            console.log(`Adding owner to group members:`, ownerData);
            members.push({
              id: ownerData.id,
              name: ownerData.username || 'Group Owner',
              avatar: ownerData.avatar_url
            });
          }
        }
        
        return { ...group, members };
      });
      
      return Promise.all(groupsWithMembersPromises);
    },
    enabled: !!user && friendGroups.length > 0 && friendsList.length > 0
  });
  
  // Create a new friend group
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string, description?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('friend_groups')
        .insert({
          user_id: user.id,
          name,
          description
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Friend group created');
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
    },
    onError: (error) => {
      console.error('Error creating friend group:', error);
      toast.error('Failed to create friend group');
    }
  });
  
  // Delete a friend group
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('friend_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      toast.success('Friend group deleted');
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
    },
    onError: (error) => {
      console.error('Error deleting friend group:', error);
      toast.error('Failed to delete friend group');
    }
  });
  
  // Update a friend group
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string, name: string, description?: string }) => {
      const { data, error } = await supabase
        .from('friend_groups')
        .update({
          name,
          description
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Friend group updated');
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
    },
    onError: (error) => {
      console.error('Error updating friend group:', error);
      toast.error('Failed to update friend group');
    }
  });
  
  // Add a friend to a group
  const addFriendToGroupMutation = useMutation({
    mutationFn: async ({ groupId, friendId }: { groupId: string, friendId: string }) => {
      const { data, error } = await supabase
        .from('friend_group_members')
        .insert({
          group_id: groupId,
          friend_id: friendId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Friend added to group');
      queryClient.invalidateQueries({ queryKey: ['friend-group-members'] });
    },
    onError: (error) => {
      console.error('Error adding friend to group:', error);
      toast.error('Failed to add friend to group');
    }
  });
  
  // Remove a friend from a group
  const removeFriendFromGroupMutation = useMutation({
    mutationFn: async ({ groupId, friendId }: { groupId: string, friendId: string }) => {
      const { error } = await supabase
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

  return {
    friendGroups: groupsWithMembers,
    isLoading: isLoadingGroups || isLoadingMembers,
    createGroup: createGroupMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    updateGroup: updateGroupMutation.mutate,
    addFriendToGroup: addFriendToGroupMutation.mutate,
    removeFriendFromGroup: removeFriendFromGroupMutation.mutate,
    refetchGroups
  };
};
