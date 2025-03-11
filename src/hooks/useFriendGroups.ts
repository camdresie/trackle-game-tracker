
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { FriendGroup, Player } from '@/utils/types';

export const useFriendGroups = (friendsList: Player[] = []) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch friend groups
  const { 
    data: friendGroups = [], 
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useQuery({
    queryKey: ['friend-groups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('friend_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching friend groups:', error);
        toast.error('Failed to load friend groups');
        return [];
      }
      
      return data as FriendGroup[];
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
        const { data, error } = await supabase
          .from('friend_group_members')
          .select('*')
          .eq('group_id', group.id);
        
        if (error) {
          console.error(`Error fetching members for group ${group.id}:`, error);
          return { ...group, members: [] };
        }
        
        // Map members from friend IDs to Player objects
        const members = data.map(memberData => {
          const friend = friendsList.find(f => f.id === memberData.friend_id);
          return friend || {
            id: memberData.friend_id,
            name: 'Unknown Friend',
          };
        });
        
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
