import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { GroupMessage } from '@/utils/types';

// Number of messages to fetch initially and per page
const MESSAGES_PER_PAGE = 25;

export const useGroupMessages = (groupId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Track current page and hasMore state
  const [page, setPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [allMessages, setAllMessages] = useState<GroupMessage[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const isLoadingMoreRef = useRef(false);
  
  // Fetch messages for a specific group
  const { 
    data: pageMessages = [], 
    isLoading,
    isFetching,
    refetch,
    isSuccess,
    error
  } = useQuery({
    queryKey: ['group-messages', groupId, page],
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
      
      console.log(`Fetching messages for group ${groupId}, page ${page}`);
      
      // Calculate range for pagination
      const from = page * MESSAGES_PER_PAGE;
      const to = from + MESSAGES_PER_PAGE - 1;
      
      // First get count of total messages to determine if there are more
      const { count, error: countError } = await supabase
        .from('group_messages')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId);
      
      if (countError) {
        console.error('Error counting messages:', countError);
      }
      
      // Fetch paginated messages with the newest first
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select('id, group_id, user_id, content, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false }) // Newest first
        .range(from, to);
      
      if (error) {
        console.error('Error fetching group messages:', error);
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          toast.error('Failed to load messages');
        }
        return [];
      }
      
      // If no messages, return empty array
      if (!messagesData || messagesData.length === 0) {
        setHasMoreMessages(false);
        return [];
      }
      
      // Check if we have more messages
      if (count) {
        setHasMoreMessages(from + messagesData.length < count);
        console.log(`Loaded ${from + messagesData.length} of ${count} total messages`);
      } else {
        setHasMoreMessages(messagesData.length === MESSAGES_PER_PAGE);
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
    staleTime: 60000, // 1 minute
    retry: 1, // Only retry once in case of failure
  });
  
  // Force initial fetch when component mounts
  useEffect(() => {
    if (groupId && user && page === 0 && allMessages.length === 0) {
      refetch();
    }
  }, [groupId, user, refetch, page, allMessages.length]);
  
  // After initial load is successful, mark it as complete
  useEffect(() => {
    if (isSuccess && !isInitialLoadComplete && page === 0) {
      setIsInitialLoadComplete(true);
    }
  }, [isSuccess, isInitialLoadComplete, page]);
  
  // Reset loading more ref when fetch completes
  useEffect(() => {
    if (!isFetching) {
      isLoadingMoreRef.current = false;
    }
  }, [isFetching]);
  
  // Update allMessages when new page data is loaded
  useEffect(() => {
    if (pageMessages.length > 0) {
      setAllMessages(prev => {
        // Create a map of existing messages by ID for quick lookup
        const existingMap = new Map(prev.map(msg => [msg.id, msg]));
        
        // Add new messages
        pageMessages.forEach(message => {
          if (!existingMap.has(message.id)) {
            existingMap.set(message.id, message);
          }
        });
        
        // Convert back to array and sort by created_at (newest first)
        const combined = Array.from(existingMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return combined;
      });
    }
  }, [pageMessages]);
  
  // Reset when groupId changes
  useEffect(() => {
    setPage(0);
    setAllMessages([]);
    setHasMoreMessages(true);
    setIsInitialLoadComplete(false);
    isLoadingMoreRef.current = false;
  }, [groupId]);
  
  // Load more messages - with protection against multiple calls
  const loadMoreMessages = useCallback(() => {
    if (hasMoreMessages && !isLoading && !isFetching && !isLoadingMoreRef.current) {
      // Set loading flag to prevent multiple calls
      isLoadingMoreRef.current = true;
      console.log('Loading more messages, increasing page to', page + 1);
      setPage(prevPage => prevPage + 1);
    }
  }, [hasMoreMessages, isLoading, isFetching, page]);
  
  // Set up realtime subscription for new messages
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
          // When a new message arrives, invalidate only the first page query
          queryClient.invalidateQueries({ queryKey: ['group-messages', groupId, 0] });
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
      // Invalidate only the first page query to get the newly sent message
      queryClient.invalidateQueries({ queryKey: ['group-messages', groupId, 0] });
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  });
  
  return {
    messages: allMessages,
    isLoading,
    isFetchingNextPage: isFetching && page > 0,
    hasMoreMessages,
    loadMoreMessages,
    isInitialLoadComplete,
    sendMessage: (content: string) => sendMessageMutation.mutate(content),
    isSending: sendMessageMutation.isPending,
    error
  };
};
