import { useState, useEffect, useCallback, useRef } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { GroupMessage } from '@/utils/types';

// Disable detailed logging for production
const DEBUG = false;

// Number of messages to fetch initially and per page
const MESSAGES_PER_PAGE = 25;
// Poll for new messages every 10 seconds
const POLLING_INTERVAL = 10000;

// Singleton for managing polling intervals
class PollingManager {
  private static instance: PollingManager;
  private intervals: Map<string, { 
    intervalId: number, 
    refCount: number, 
    lastUsed: number,
    cleanup: boolean 
  }> = new Map();
  private cleanupIntervalId: number | null = null;

  private constructor() {
    // Start the cleanup interval
    this.cleanupIntervalId = window.setInterval(() => this.cleanupIntervals(), 30000);
  }

  public static getInstance(): PollingManager {
    if (!PollingManager.instance) {
      PollingManager.instance = new PollingManager();
    }
    return PollingManager.instance;
  }

  public registerInterval(groupId: string, callback: () => void): void {
    // Get existing or create new interval data
    const existingInterval = this.intervals.get(groupId);
    
    if (existingInterval) {
      existingInterval.refCount += 1;
      existingInterval.lastUsed = Date.now();
      existingInterval.cleanup = false;
    } else {
      // Create new interval
      const intervalId = window.setInterval(() => {
        if (!this.intervals.get(groupId)?.cleanup) {
          callback();
        }
      }, POLLING_INTERVAL);
      
      this.intervals.set(groupId, {
        intervalId: intervalId as unknown as number, 
        refCount: 1,
        lastUsed: Date.now(),
        cleanup: false
      });
    }
  }

  public unregisterInterval(groupId: string): void {
    const interval = this.intervals.get(groupId);
    if (!interval) {
      return;
    }
    
    // Mark for cleanup
    interval.cleanup = true;
    
    // Decrement refCount
    interval.refCount -= 1;
    interval.lastUsed = Date.now();
    
    // If refCount reaches 0, clear the interval immediately
    if (interval.refCount <= 0) {
      window.clearInterval(interval.intervalId);
      this.intervals.delete(groupId);
    }
  }

  private cleanupIntervals(): void {
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    
    for (const [groupId, interval] of this.intervals.entries()) {
      // Remove intervals that haven't been used in 2 minutes and have no refs
      if (now - interval.lastUsed > twoMinutes && interval.refCount <= 0) {
        window.clearInterval(interval.intervalId);
        this.intervals.delete(groupId);
      }
    }
  }

  public dispose(): void {
    // Clear all intervals
    for (const interval of this.intervals.values()) {
      window.clearInterval(interval.intervalId);
    }
    this.intervals.clear();
    
    // Clear cleanup interval
    if (this.cleanupIntervalId) {
      window.clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }
}

// Create singleton instance
const pollingManager = PollingManager.getInstance();

// Render count to track how many times hook is called
let renderCount = 0;

export const useGroupMessages = (groupId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const thisRenderCount = ++renderCount;
  const hookId = useRef(`hook-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Track current page and hasMore state
  const [page, setPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [allMessages, setAllMessages] = useState<GroupMessage[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const mountedRef = useRef(true);
  const currentGroupRef = useRef<string | null>(null);
  
  // Store the total message count from the database
  const totalMessageCountRef = useRef<number | null>(null);
  // Keep track of which pages we've loaded
  const loadedPagesRef = useRef<Set<number>>(new Set([0]));
  
  // Extra validation to make absolutely sure we have a valid groupId
  const isValidGroupId = useMemo(() => {
    const isValid = !!(groupId && 
              groupId.trim().length > 0 && 
              groupId !== '00000000-0000-0000-0000-000000000000');
    return isValid;
  }, [groupId]);
  
  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // Cleanup the polling on unmount if we had a group
      if (currentGroupRef.current) {
        pollingManager.unregisterInterval(currentGroupRef.current);
        currentGroupRef.current = null;
      }
    };
  }, [hookId, groupId]);
  
  // Setup polling for messages
  useEffect(() => {

    // Skip if no valid group or user
    if (!isValidGroupId || !groupId || !user) {
      return;
    }
    
    
    // Handle group change
    if (currentGroupRef.current && currentGroupRef.current !== groupId) {
      pollingManager.unregisterInterval(currentGroupRef.current);
    }
    
    // Update current group reference
    currentGroupRef.current = groupId;
    
    // Function to poll for messages
    const pollForMessages = () => {
      if (!mountedRef.current) {
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['group-messages', groupId, 0] });
    };
    
    // Register the interval
    pollingManager.registerInterval(groupId, pollForMessages);
    
    // Reset page and other state when group changes
    setPage(0);
    setAllMessages([]);
    setHasMoreMessages(true);
    setIsInitialLoadComplete(false);
    
    // Cleanup function
    return () => {
      // Explicitly unregister when effect is cleaned up
      if (currentGroupRef.current === groupId) {
        pollingManager.unregisterInterval(groupId);
      }
    };
  }, [groupId, user?.id, queryClient, isValidGroupId, hookId]);
  
  // Define the memo function to use in useState to avoid useMemo ESLint warnings
  const isValidGroupIdMemo = useCallback(() => {
    return !!(groupId && 
              groupId.trim().length > 0 && 
              groupId !== '00000000-0000-0000-0000-000000000000');
  }, [groupId]);
  
  // Fetch messages for a specific group
  const { 
    data: pageMessages = [], 
    isLoading,
    isFetching,
    error
  } = useQuery({
    queryKey: ['group-messages', groupId, page],
    queryFn: async () => {
      if (!isValidGroupId || !groupId || !user || !mountedRef.current) {
        return [];
      }
      
      try {
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
        } else if (count !== null && count !== undefined) {
          // Store the total count for future reference
          totalMessageCountRef.current = count;
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
        
        
        // Mark this page as loaded
        loadedPagesRef.current.add(page);
        
        // If no messages or component unmounted, return empty array
        if (!messagesData || messagesData.length === 0 || !mountedRef.current) {
          // Only if we got zero messages AND we have a reliable total count
          // AND we've loaded at least one page of messages, AND we know this page should have data
          if (mountedRef.current && 
              totalMessageCountRef.current !== null && 
              page > 0 && 
              from < totalMessageCountRef.current && 
              messagesData?.length === 0) {
            setHasMoreMessages(false);
          }
          return [];
        }
        
        // Check if we have more messages based on the database count
        if (totalMessageCountRef.current !== null && mountedRef.current) {
          // We need to account for all messages loaded across all pages
          const totalFetched = allMessages.length + 
                              (page > 0 && !loadedPagesRef.current.has(page) ? messagesData.length : 0);
                              
          const hasMore = totalFetched < totalMessageCountRef.current;
          
          
          // Only set hasMoreMessages=false if we've definitely got all messages
          // If we're uncertain, keep it true to allow the user to try loading more
          if (!hasMore) {
            setHasMoreMessages(false);
          }
        } 
        // If we got fewer than requested messages for a non-initial page, we've reached the end
        else if (mountedRef.current && page > 0 && messagesData.length < MESSAGES_PER_PAGE) {
          setHasMoreMessages(false);
        }
        // Don't update hasMoreMessages here if uncertain - keep the existing value
        
        // Set initial load complete if this is page 0
        if (page === 0 && mountedRef.current) {
          setIsInitialLoadComplete(true);
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
        
        if (!mountedRef.current) return []; // If unmounted during fetch, return empty
        
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
      } catch (error) {
        console.error("Error in query function:", error);
        return [];
      }
    },
    enabled: isValidGroupIdMemo() && !!user,
    staleTime: 2000, // Only keep data fresh for 2 seconds since we're polling
    retry: 1, // Only retry once in case of failure
    refetchOnWindowFocus: false,
  });
  
  // Update allMessages when new page data is loaded
  useEffect(() => {
    if (!mountedRef.current) return;
    
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
      
      // Special case: we received fewer than MESSAGES_PER_PAGE messages
      // AND this is not the first page, which is a reliable indicator we've reached the end
      if (page > 0 && pageMessages.length < MESSAGES_PER_PAGE) {
        setHasMoreMessages(false);
      }
      // Special case: we know the total count and have loaded that many messages
      else if (totalMessageCountRef.current !== null && 
              allMessages.length + pageMessages.length >= totalMessageCountRef.current) {
        setHasMoreMessages(false);
      }
      
      // Always reset loading flag when new messages arrive
      if (isLoadingMoreRef.current) {
        isLoadingMoreRef.current = false;
      }
    } else if (page > 0) {
      // Empty results for non-initial page - a good sign we've reached the end
      setHasMoreMessages(false);
      isLoadingMoreRef.current = false;
    }
    
    // Update the page status if still mounted
    if (mountedRef.current) {
      loadedPagesRef.current.add(page);
    }
  }, [pageMessages, hookId, page, groupId]);
  
  // Mutation for sending a new message
  const { mutateAsync, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!isValidGroupId || !groupId || !user) {
        throw new Error('Invalid group or user');
      }
      
      const { data, error } = await supabase
        .from('group_messages')
        .insert([
          { 
            group_id: groupId, 
            user_id: user.id, 
            content 
          }
        ])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate the latest messages to refresh
      if (groupId) {
        queryClient.invalidateQueries({ 
          queryKey: ['group-messages', groupId, 0] 
        });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  });

  // Function to load more messages (previous page)
  const loadMoreMessages = useCallback(() => {
    if (isLoadingMoreRef.current) {
      return;
    }
    
    // Track this request specifically 
    const requestPage = page + 1;
    
    // Start loading
    isLoadingMoreRef.current = true;
    
    // Even if hasMoreMessages is false, we'll still try loading more
    // We'll only determine there are no more messages if we actually get an empty result set
    
    // Set the next page - this triggers the query
    setPage(requestPage);
    
    // Reset the loading flags after a reasonable timeout
    // This ensures the UI doesn't get stuck in a loading state
    setTimeout(() => {
      if (mountedRef.current && isLoadingMoreRef.current) {
        isLoadingMoreRef.current = false;
        
        // If we're still loading after timeout, we might have encountered an issue
        // Let's set hasMoreMessages back to true to allow trying again
        if (!pageMessages || pageMessages.length === 0) {
          setHasMoreMessages(true);
        }
      }
    }, 3000);
    
  }, [groupId, hookId, page, allMessages.length, pageMessages]);

  // Function to send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !isValidGroupId) return;
    
    try {
      await mutateAsync(content.trim());
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [mutateAsync, isValidGroupId, hookId]);

  
  return {
    messages: allMessages,
    isLoading,
    isFetching,
    isSending,
    sendMessage,
    hasMoreMessages,
    loadMoreMessages,
    isFetchingNextPage: isLoadingMoreRef.current,
    isInitialLoadComplete
  };
};

// Helper function to define useMemo without ESLint warnings
function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(factory, deps);
}
