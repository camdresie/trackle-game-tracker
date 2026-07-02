import { useEffect, useState, useMemo, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FriendGroup, Player } from '@/utils/types';
import { toast } from 'sonner';

// Interface for the hook props
interface UseFriendGroupsProps {
  friends?: Player[];
  enabled?: boolean;
}

// Interface for the group with status
interface GroupWithStatus extends Record<string, any> {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  description?: string;
  member_status?: string;
}

// Hook result interface
interface UseFriendGroupsResult {
  friendGroups: FriendGroup[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
  createGroup: (data: { name: string, description?: string }) => Promise<FriendGroup | null>;
  updateGroup: (data: { id: string, name: string, description?: string }) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  addFriendToGroup: (data: { groupId: string, friendId: string }) => Promise<boolean>;
  removeFriendFromGroup: (data: { groupId: string, friendId: string }) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
}

// Main hook function
export const useFriendGroups = (friends: Player[] = [], { enabled = true }: UseFriendGroupsProps = {}): UseFriendGroupsResult => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  // Fetch friend groups using React Query
  const { data: rawGroupsData = [], isLoading, isError, refetch: refetchGroups } = useQuery({
    queryKey: ['friend-groups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        
        // Query for groups that the current user owns
        const { data: ownedGroups, error: ownedError } = await supabase
          .from('friend_groups')
          .select('id, name, created_at, updated_at, user_id, description')
          .eq('user_id', user.id);
        
        if (ownedError) {
          throw ownedError;
        }
        
        
        // First get the group IDs where the user is a member or invited
        const { data: memberGroups, error: memberError } = await supabase
          .from('friend_group_members')
          .select('group_id, status')
          .eq('friend_id', user.id);
          
        if (memberError) {
          console.error('Error fetching member groups:', memberError);
          throw memberError;
        }

        if (memberGroups && memberGroups.length > 0) {
          // Get the group IDs from the member groups
          const groupIds = memberGroups.map(m => m.group_id);
          
          // Create a map to store statuses for each group
          const statusByGroupId = memberGroups.reduce((map, m) => {
            map[m.group_id] = m.status;
            return map;
          }, {} as Record<string, string>);
          
          // Fetch the actual group data
          const { data: memberGroupData, error: groupError } = await supabase
            .from('friend_groups')
            .select('id, name, created_at, updated_at, user_id, description')
            .in('id', groupIds);
            
          if (groupError) {
            console.error('Error fetching member group details:', groupError);
            throw groupError;
          }
          
          // Add status to each group
          const memberGroupsWithStatus = memberGroupData?.map(group => ({
            ...group,
            member_status: statusByGroupId[group.id] || 'unknown'
          })) || [];
          
          // Combine owned groups and groups the user is a member of
          const allGroups = [...(ownedGroups || []), ...memberGroupsWithStatus];
          
          // Remove any duplicates based on group ID
          const uniqueGroups = Array.from(
            new Map(allGroups.map(group => [group.id, group])).values()
          );
          
          return uniqueGroups;
        }
        
        // If no member groups, just return owned groups
        return ownedGroups || [];
      } catch (error) {
        console.error('Error fetching friend groups:', error);
        return [];
      }
    },
    enabled: !!user && enabled,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });
  
  // Fetch all group members for each group in a single query for efficiency
  const { data: groupMembersData = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['group-members', user?.id, rawGroupsData.map(g => g.id).join('|')],
    queryFn: async () => {
      if (!user || rawGroupsData.length === 0) return [];
      
      try {
        // Get all group IDs from rawGroupsData
        const groupIds = rawGroupsData.map(group => group.id);
        
        // Fetch all group members for all groups in a single query
        const { data, error } = await supabase
          .from('friend_group_members')
          .select('id, group_id, friend_id, status, added_at')
          .in('group_id', groupIds);
          
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error fetching group members:', error);
        return [];
      }
    },
    enabled: !!user && rawGroupsData.length > 0 && enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  });
  
  // Fetch all member profiles in a single query for efficiency
  const { data: memberProfilesData = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['member-profiles', groupMembersData.map(m => m.friend_id).join('|')],
    queryFn: async () => {
      if (groupMembersData.length === 0) return [];
      
      try {
        // Get unique user IDs from groupMembersData
        const uniqueUserIds = [...new Set(groupMembersData.map(m => m.friend_id))];
        
        // Fetch all member profiles in a single query
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', uniqueUserIds);
          
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error fetching member profiles:', error);
        return [];
      }
    },
    enabled: groupMembersData.length > 0 && enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  });
  
  // Combine the raw group data with member information for each group
  const friendGroups = useMemo(() => {
    if (isLoading || isLoadingMembers || isLoadingProfiles) return [];
    
    const groups = rawGroupsData.map(group => {
      // Get all members for this group
      const groupMembers = groupMembersData.filter(m => m.group_id === group.id);
      
      // Separate members into accepted and pending
      const acceptedMembers = groupMembers.filter(m => m.status === 'accepted');
      const pendingMembers = groupMembers.filter(m => m.status === 'pending');
      
      // Enrich members with profile data (username, avatar, etc.)
      const enrichedAcceptedMembers = acceptedMembers.map(member => {
        const profile = memberProfilesData.find(p => p.id === member.friend_id);
        return {
          id: member.friend_id,
          name: profile?.full_name || profile?.username || 'Unknown',
          status: member.status,
          avatar: profile?.avatar_url,
          memberId: member.id,
          createdAt: member.added_at
        };
      });
      
      const enrichedPendingMembers = pendingMembers.map(member => {
        const profile = memberProfilesData.find(p => p.id === member.friend_id);
        return {
          id: member.friend_id,
          name: profile?.full_name || profile?.username || 'Unknown',
          status: member.status,
          avatar: profile?.avatar_url,
          memberId: member.id,
          createdAt: member.added_at
        };
      });
      
      // Build the final group object with members
      const memberStatus = (group as GroupWithStatus).member_status;
      
      // Ensure status is of the correct type
      let typedStatus: 'pending' | 'accepted' | 'rejected' | 'left' | undefined;
      if (memberStatus === 'pending' || 
          memberStatus === 'accepted' || 
          memberStatus === 'rejected' || 
          memberStatus === 'left') {
        typedStatus = memberStatus;
      } else {
        typedStatus = undefined;
      }
      
      return {
        id: group.id,
        name: group.name,
        user_id: group.user_id,
        created_at: group.created_at,
        updated_at: group.updated_at || group.created_at,
        isOwner: group.user_id === user?.id,
        members: enrichedAcceptedMembers,
        pendingMembers: enrichedPendingMembers,
        description: group.description || '',
        pendingCount: pendingMembers.length,
        status: typedStatus, // Use the correctly typed status
        // Consider user joined if:
        // 1. They own the group OR
        // 2. They are an accepted member OR
        // 3. They have any status (pending/rejected) in the group
        isJoinedGroup: group.user_id === user?.id || 
          enrichedAcceptedMembers.some(m => m.id === user?.id) ||
          memberStatus === 'pending' // Use the extracted member status
      };
    });
    
    // Sort groups by name for consistency
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }, [isLoading, isLoadingMembers, isLoadingProfiles, rawGroupsData, groupMembersData, memberProfilesData, user?.id]);
  
  // Create a new friend group
  const createGroup = async (data: { name: string, description?: string }) => {
    if (!user) return null;
    
    setIsCreatingGroup(true);
    try {
      // Check if name is a JSON string and extract the actual name
      let processedName = data.name;
      try {
        // If name is a JSON string that includes a name property, extract it
        if (data.name.startsWith('{') && data.name.includes('"name"')) {
          const parsed = JSON.parse(data.name);
          if (parsed.name && typeof parsed.name === 'string') {
            processedName = parsed.name;
          }
        }
      } catch (e) {
        // If JSON parsing fails, use the original name
        console.warn('Failed to parse potential JSON in group name:', e);
      }
      
      // Create the new group with the processed name
      const { data: responseData, error } = await supabase
        .from('friend_groups')
        .insert({ 
          name: processedName, 
          user_id: user.id,
          description: data.description || (typeof data.name === 'string' && data.name.startsWith('{') ? 
            (() => {
              try {
                const parsed = JSON.parse(data.name);
                return parsed.description || '';
              } catch (e) {
                return '';
              }
            })() : '')
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      
      // Show success toast
      toast.success('Group created successfully');
      
      // Return a properly formatted FriendGroup object
      return {
        id: responseData.id,
        name: responseData.name,
        user_id: responseData.user_id,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at || responseData.created_at,
        members: [],
        description: responseData.description || '',
        pendingCount: 0,
        isOwner: true,
        isJoinedGroup: true
      };
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
      return null;
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Add a friend to a group (send invitation)
  const addFriendToGroup = async (params: { groupId: string, friendId: string }) => {
    if (!user) return false;
    
    try {
      // Verify that the group exists and is visible to the user. RLS makes the
      // group readable to its owner, accepted members, and pending invitees.
      const { data: groupData, error: groupError } = await supabase
        .from('friend_groups')
        .select('id, name, user_id')
        .eq('id', params.groupId)
        .single();

      if (groupError || !groupData) {
        console.error('Error finding group:', groupError);
        toast.error('Group not found or you don\'t have access');
        return false;
      }

      // Only the owner or an accepted member may invite others.
      const isOwner = groupData.user_id === user.id;
      if (!isOwner) {
        const { data: memberData, error: memberError } = await supabase
          .from('friend_group_members')
          .select()
          .eq('group_id', params.groupId)
          .eq('friend_id', user.id)
          .eq('status', 'accepted')
          .single();

        if (memberError || !memberData) {
          console.error('User is not authorized to add members to this group:', memberError);
          toast.error('You do not have permission to add members to this group');
          return false;
        }
      }
      
      // Verify the friend exists
      const { data: friendData, error: friendError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', params.friendId)
        .single();
        
      if (friendError) {
        console.error('Error finding friend:', friendError);
        toast.error('Friend not found');
        return false;
      }
      
      // Check if friend is already in this group
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('friend_group_members')
        .select()
        .eq('group_id', params.groupId)
        .eq('friend_id', params.friendId);
        
      if (memberCheckError) {
        console.error('Error checking existing membership:', memberCheckError);
      } else if (existingMember && existingMember.length > 0) {
        toast.error('This person is already in the group or has a pending invitation');
        return false;
      }
      
      // RLS allows the group owner or an accepted member to insert an invite.
      const { error: insertError } = await supabase
        .from('friend_group_members')
        .insert({
          group_id: params.groupId,
          friend_id: params.friendId,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error inserting group invitation:', insertError);
        toast.error('Failed to send invitation');
        return false;
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
      
      toast.success('Invitation sent successfully');
      return true;
    } catch (error) {
      console.error('Error adding friend to group:', error);
      toast.error('Failed to send invitation');
      return false;
    }
  };
  
  // Leave a group
  const leaveGroup = async (groupId: string) => {
    if (!user) return false;
    
    try {
      // First check if the user is the owner of the group
      const { data: groupData, error: groupError } = await supabase
        .from('friend_groups')
        .select('user_id')
        .eq('id', groupId)
        .single();
        
      if (groupError) {
        throw new Error(`Group with ID ${groupId} not found in database`);
      }
      
      // If user is the owner, delete the whole group
      if (groupData.user_id === user.id) {
        // Delete all members first (cascade would be better but let's be explicit)
        await supabase
          .from('friend_group_members')
          .delete()
          .eq('group_id', groupId);
          
        // Then delete the group
        const { error: deleteError } = await supabase
          .from('friend_groups')
          .delete()
          .eq('id', groupId);
          
        if (deleteError) {
          throw deleteError;
        }
        
        toast.success('Group deleted successfully');
      } else {
        // If user is just a member, remove their membership
        const { data: memberRecord, error: memberError } = await supabase
          .from('friend_group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('friend_id', user.id);
          
        if (memberError) {
          throw memberError;
        }
        
        if (!memberRecord || memberRecord.length === 0) {
          throw new Error('No membership records found for this user in this group');
        }
        
        // Delete the membership record
        const { error: deleteError } = await supabase
          .from('friend_group_members')
          .delete()
          .eq('id', memberRecord[0].id);
          
        if (deleteError) {
          throw deleteError;
        }
        
        toast.success('You have left the group');
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
      return false;
    }
  };
  
  // Refresh friend groups data
  const refetch = async () => {
    await refetchGroups();
  };
  
  // Update an existing friend group
  const updateGroup = async (data: { id: string, name: string, description?: string }) => {
    if (!user) return false;
    
    try {
      // First verify that the group exists and the user is the owner
      const { data: groupData, error: groupError } = await supabase
        .from('friend_groups')
        .select('user_id')
        .eq('id', data.id)
        .single();
        
      if (groupError) {
        console.error('Error finding group:', groupError);
        toast.error('Group not found');
        return false;
      }
      
      // Check if the logged-in user is the owner
      const isOwner = groupData.user_id === user.id;
      
      if (!isOwner) {
        console.error('User is not authorized to update this group');
        toast.error('You do not have permission to update this group');
        return false;
      }
      
      // Update the group
      const { error } = await supabase
        .from('friend_groups')
        .update({
          name: data.name,
          description: data.description || ''
        })
        .eq('id', data.id);
        
      if (error) {
        throw error;
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      
      toast.success('Group updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
      return false;
    }
  };
  
  // Delete a friend group
  const deleteGroup = async (groupId: string) => {
    if (!user) return false;
    
    try {
      // First verify that the group exists and the user is the owner
      const { data: groupData, error: groupError } = await supabase
        .from('friend_groups')
        .select('user_id')
        .eq('id', groupId)
        .single();
        
      if (groupError) {
        console.error('Error finding group:', groupError);
        toast.error('Group not found');
        return false;
      }
      
      // Check if the logged-in user is the owner
      const isOwner = groupData.user_id === user.id;
      
      if (!isOwner) {
        console.error('User is not authorized to delete this group');
        toast.error('You do not have permission to delete this group');
        return false;
      }
      
      // Delete all members first
      await supabase
        .from('friend_group_members')
        .delete()
        .eq('group_id', groupId);
        
      // Then delete the group
      const { error } = await supabase
        .from('friend_groups')
        .delete()
        .eq('id', groupId);
        
      if (error) {
        throw error;
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      
      toast.success('Group deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
      return false;
    }
  };
  
  // Remove a friend from a group
  const removeFriendFromGroup = async (params: { groupId: string, friendId: string }) => {
    if (!user) return false;
    
    try {
      // First verify that the group exists and the user is the owner
      const { data: groupData, error: groupError } = await supabase
        .from('friend_groups')
        .select('user_id')
        .eq('id', params.groupId)
        .single();
        
      if (groupError) {
        console.error('Error finding group:', groupError);
        toast.error('Group not found');
        return false;
      }
      
      // Check if the logged-in user is the owner
      const isOwner = groupData.user_id === user.id;
      
      if (!isOwner) {
        console.error('User is not authorized to remove members from this group');
        toast.error('You do not have permission to remove members from this group');
        return false;
      }
      
      // Find the membership record
      const { data: memberRecord, error: memberError } = await supabase
        .from('friend_group_members')
        .select('id')
        .eq('group_id', params.groupId)
        .eq('friend_id', params.friendId);
        
      if (memberError) {
        console.error('Error finding membership record:', memberError);
        return false;
      }
      
      if (!memberRecord || memberRecord.length === 0) {
        console.warn('No membership record found to remove');
        return true; // Already not a member, so technically success
      }
      
      // Delete the membership record
      const { error } = await supabase
        .from('friend_group_members')
        .delete()
        .eq('id', memberRecord[0].id);
        
      if (error) {
        throw error;
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
      
      toast.success('Friend removed from group');
      return true;
    } catch (error) {
      console.error('Error removing friend from group:', error);
      toast.error('Failed to remove friend from group');
      return false;
    }
  };
  
  // Return the hook interface
  return {
    friendGroups,
    isLoading: isLoading || isLoadingMembers || isCreatingGroup,
    isError,
    refetch,
    createGroup,
    updateGroup,
    deleteGroup,
    addFriendToGroup,
    removeFriendFromGroup,
    leaveGroup
  };
};
