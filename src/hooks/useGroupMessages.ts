
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
          profiles(username, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching group messages:', error);
        toast.error('Failed to load messages');
        return [];
      }
      
      console.log('Group messages data:', data);
      
      // Transform the data to match our GroupMessage type with sender info
      return data.map(item => {
        let senderInfo: { username: string; avatar_url?: string } | undefined = undefined;
        
        // Handle the profiles data correctly based on its structure
        if (item.profiles) {
          if (Array.isArray(item.profiles) && item.profiles.length > 0) {
            // If profiles is an array, take the first element
            const profile = item.profiles[0];
            senderInfo = {
              username: profile.username,
              avatar_url: profile.avatar_url
            };
          } else {
            // If profiles is a single object (not an array)
            // Need to cast here to tell TypeScript it's not an array
            const profile = item.profiles as unknown as { username: string; avatar_url?: string };
            senderInfo = {
              username: profile.username,
              avatar_url: profile.avatar_url
            };
          }
        }
        
        return {
          id: item.id,
          group_id: item.group_id,
          user_id: item.user_id,
          content: item.content,
          created_at: item.created_at,
          sender: senderInfo
        };
      }) as GroupMessage[];
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
