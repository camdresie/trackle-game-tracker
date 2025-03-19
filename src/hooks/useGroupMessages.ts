
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
      
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          id,
          group_id,
          user_id,
          content,
          created_at,
          profiles:user_id(username, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching group messages:', error);
        toast.error('Failed to load messages');
        return [];
      }
      
      // Transform the data to match our GroupMessage type with sender info
      return data.map(item => ({
        id: item.id,
        group_id: item.group_id,
        user_id: item.user_id,
        content: item.content,
        created_at: item.created_at,
        sender: item.profiles
      })) as GroupMessage[];
    },
    enabled: !!groupId && !!user
  });
  
  // Set up realtime subscription
  useEffect(() => {
    if (!groupId || !user || isSubscribed) return;
    
    const channel = supabase
      .channel('group-messages-changes')
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
          // Refetch to get the latest messages with sender info
          refetch();
        }
      )
      .subscribe();
    
    setIsSubscribed(true);
    
    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [groupId, user, isSubscribed, refetch]);
  
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
      // But we could manually add the message to the cache for immediate feedback
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
