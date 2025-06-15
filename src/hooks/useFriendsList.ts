import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Player } from '@/utils/types';
import { toast } from '@/components/ui/use-toast';
import { useConnections } from '@/hooks/connections/useConnections';
import { useQueryClient } from '@tanstack/react-query';

interface UseFriendsListProps {
  refreshTrigger?: number;
}

interface FriendsListResult {
  friends: Player[];
  refreshFriends: () => Promise<boolean>;
}

/**
 * Hook for managing the user's friends list
 * Now using the optimized useConnections hook
 */
export const useFriendsList = ({ refreshTrigger = 0 }: UseFriendsListProps = {}): FriendsListResult => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState<number>(refreshTrigger);
  
  // Memoize the user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id || '', [user?.id]);
  const isUserLoggedIn = useMemo(() => !!user, [user]);
  
  const { data: friends = [], refetch: refetchFriends, isLoading } = useConnections(
    userId, 
    isUserLoggedIn
  );

  const queryClient = useQueryClient();

  // Function to refresh friends list
  const refreshFriends = useCallback(async () => {
    if (!user) return false;
    
    try {
      // Invalidate cache to force refetch
      queryClient.invalidateQueries({ queryKey: ['friends', user.id] });
      
      // Manually refetch 
      await refetchFriends();
      
      return true;
    } catch (error) {
      console.error('Error refreshing friends:', error);
      return false;
    }
  }, [user, queryClient, refetchFriends]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    friends,
    refreshFriends
  }), [friends, refreshFriends]);
};
