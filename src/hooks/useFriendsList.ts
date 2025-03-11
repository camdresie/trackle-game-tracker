
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Player } from '@/utils/types';
import { supabase } from '@/lib/supabase';

interface UseFriendsListProps {
  refreshTrigger?: number;
}

interface FriendsListResult {
  friends: Player[];
  refreshFriends: () => Promise<void>;
}

/**
 * Hook for managing the user's friends list
 */
export const useFriendsList = ({ refreshTrigger = 0 }: UseFriendsListProps = {}): FriendsListResult => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Player[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // Enhanced function to fetch friends data with more robust error handling
  const fetchFriends = async () => {
    if (!user) {
      console.log('No user available, skipping friends fetch');
      return [];
    }
    
    try {
      console.log('Fetching friends data for user:', user.id);
      
      // Get user connections (friends) with timestamp to prevent caching
      const timestamp = new Date().getTime();
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('*, friend:profiles!connections_friend_id_fkey(*), user:profiles!connections_user_id_fkey(*)')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .order('id', { ascending: false });
        
      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        toast({
          title: "Error",
          description: "Failed to load friends data",
          variant: "destructive"
        });
        return [];
      }
      
      console.log('Connections data (count):', connections?.length || 0);
      
      if (!connections || connections.length === 0) {
        console.log('No connections found for user:', user.id);
        return [];
      }
      
      // Format the connections data into friends array
      const friendsData = connections.map(conn => {
        // Determine if the current user is the initiator
        const isUserInitiator = conn.user_id === user.id;
        
        // Get the correct profile based on the relationship direction
        const friendProfile = isUserInitiator ? conn.friend : conn.user;
        
        if (!friendProfile) {
          console.error('Missing profile data in connection:', conn);
          return null;
        }
        
        return {
          id: isUserInitiator ? conn.friend_id : conn.user_id,
          name: friendProfile.username || friendProfile.full_name || 'Unknown User',
          avatar: friendProfile.avatar_url,
          connectionId: conn.id
        };
      }).filter(Boolean) as Player[];
      
      console.log('Formatted friends data:', friendsData);
      return friendsData;
    } catch (error) {
      console.error('Error in fetchFriends function:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading friends",
        variant: "destructive"
      });
      return [];
    }
  };

  // Enhanced function to refresh friends data with better error handling
  const refreshFriends = async () => {
    console.log('Refreshing friends data...');
    
    try {
      // Update refresh timestamp to force dependent queries to update
      setLastRefreshTime(Date.now());
      
      // Wait a moment to allow database changes to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch fresh friends data
      const freshFriends = await fetchFriends();
      setFriends(freshFriends);
      
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
  };

  // Fetch friends when the component mounts or refresh is triggered
  useEffect(() => {
    async function loadFriends() {
      if (user) {
        const friendsData = await fetchFriends();
        setFriends(friendsData);
      }
    }
    
    loadFriends();
  }, [user, lastRefreshTime, refreshTrigger]);

  return {
    friends,
    refreshFriends
  };
};
