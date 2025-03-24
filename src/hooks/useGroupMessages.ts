
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { GroupMessage } from '@/utils/types';

export const useGroupMessages = (groupId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch messages for a specific group
  const { 
    data: messages = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: async () => {
      if (!groupId || !user) return [];
      
      // First check if user has access to this group (as owner or member)
      const { data: accessCheck, error: accessError } = await supabase.rpc('can_user_access_group', {
        p_group_id: groupId,
        p_user_id: user.id
      });
      
      if (accessError) {
        console.error('Error checking group access:', accessError);
        toast.error('You do not have access to this group');
        return [];
      }
      
      if (!accessCheck) {
        toast.error('You do not have access to this group');
        return [];
      }
      
      // Fetch just the messages first
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select('id, group_id, user_id, content, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching group messages:', error);
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          toast.error('Failed to load messages');
        }
        return [];
      }
      
      // If no messages, return empty array
      if (!messagesData || messagesData.length === 0) {
        return [];
      }
      
      // Collect unique user IDs to fetch profiles
      const userIds = [...new Set(messagesData.map(message => message.user_id))];
      
      // Fetch profiles for all message senders in one query
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Create a map of user_id to profile data for quick lookup
      const profilesMap = (profilesData || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {} as Record<string, any>);
      
      // Add sender info to each message
      const messagesWithSender = messagesData.map(message => ({
        id: message.id,
        group_id: message.group_id,
        user_id: message.user_id,
        content: message.content,
        created_at: message.created_at,
        sender: profilesMap[message.user_id] || { username: 'Unknown User' }
      }));
      
      return messagesWithSender as GroupMessage[];
    },
    enabled: !!groupId && !!user,
    refetchInterval: 5000 // Poll for new messages every 5 seconds
  });
  
  // Set up realtime subscription only once when groupId changes
  useEffect(() => {
    if (!groupId || !user) {
      return;
    }
    
    // Create a unique channel name based on groupId
    const channelName = `group-messages-${groupId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          // Invalidate the query to refetch messages
          queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] });
        }
      )
      .subscribe();
    
    // Clean up function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user, queryClient]);
  
  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!groupId || !user) throw new Error('Missing group ID or user');
      
      // First explicitly check if user can access this group
      const { data: canAccess, error: accessError } = await supabase.rpc('can_user_access_group', {
        p_group_id: groupId,
        p_user_id: user.id
      });
      
      if (accessError || !canAccess) {
        console.error('Error checking access:', accessError || 'Access denied');
        throw new Error('You do not have permission to send messages in this group');
      }
      
      // If access check passes, insert the message
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Manually trigger a refetch to get the newly sent message immediately
      refetch();
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  });
  
  return {
    messages,
    isLoading,
    sendMessage: (content: string) => sendMessageMutation.mutate(content),
    isSending: sendMessageMutation.isPending
  };
};
