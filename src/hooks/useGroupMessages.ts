
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { GroupMessage } from '@/utils/types';

export const useGroupMessages = (groupId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Fetch messages for a specific group
  const { 
    data: messages = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: async () => {
      if (!groupId || !user) return [];
      
      // First fetch the messages without trying to join with profiles
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select(`
          id,
          group_id,
          user_id,
          content,
          created_at
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      
      if (error) {
        // Only show toast for actual errors, not empty results
        console.error('Error fetching group messages:', error);
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          toast.error('Failed to load messages');
        }
        return [];
      }
      
      // If no messages, return empty array (no need to fetch profile info)
      if (!messagesData || messagesData.length === 0) {
        return [];
      }
      
      // For each message, fetch the sender's profile information separately
      const messagesWithSender = await Promise.all(
        messagesData.map(async (message) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', message.user_id)
            .maybeSingle(); // Use maybeSingle instead of single to avoid errors
          
          return {
            ...message,
            sender: profileData || undefined
          };
        })
      );
      
      return messagesWithSender as GroupMessage[];
    },
    enabled: !!groupId && !!user
  });
  
  // Set up realtime subscription only once when groupId changes
  useEffect(() => {
    if (!groupId || !user) {
      return;
    }
    
    // Create a unique channel name based on groupId
    const channelName = `group-messages-${groupId}`;
    console.log(`Setting up channel: ${channelName}`);
    
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
          console.log('New message received:', payload);
          // Invalidate the query to refetch messages
          queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] });
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });
    
    // Clean up function
    return () => {
      console.log(`Cleaning up channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [groupId, user, queryClient]); // Remove isSubscribed and refetch dependencies
  
  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!groupId || !user) throw new Error('Missing group ID or user');
      
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // No need to invalidate query as realtime will handle it
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  });
  
  return {
    messages,
    isLoading,
    sendMessage: (content: string) => sendMessageMutation.mutate(content),
    isSending: sendMessageMutation.isPending
  };
};
