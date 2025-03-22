
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Player } from '@/utils/types';
import { toast } from '@/components/ui/use-toast';
import { useConnections } from '@/hooks/connections/useConnections';

interface UseFriendsListProps {
  refreshTrigger?: number;
}

interface FriendsListResult {
  friends: Player[];
  refreshFriends: () => Promise<void>;
}

/**
 * Hook for managing the user's friends list
 * Now using the optimized useConnections hook
 */
export const useFriendsList = ({ refreshTrigger = 0 }: UseFriendsListProps = {}): FriendsListResult => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState<number>(refreshTrigger);
  
  const { data: friends = [], refetch: refetchFriends } = useConnections(
    user?.id || '', 
    !!user
  );

  // Enhanced function to refresh friends data
  const refreshFriends = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping friends refresh');
      return;
    }
    
    try {
      console.log('Refreshing friends data...');
      
      // Update refresh timestamp to force requery
      setRefreshKey(Date.now());
      
      // Wait a moment to allow database changes to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Trigger refetch from the query cache
      await refetchFriends();
      
      console.log('Friends data refreshed successfully');
      
      // Show success toast
      toast({
        title: "Success",
        description: "Friend data refreshed successfully"
      });
    } catch (error) {
      console.error('Error refreshing friends data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh friends data",
        variant: "destructive"
      });
    }
  }, [user, refetchFriends]);

  return {
    friends,
    refreshFriends
  };
};
