
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player, Connection } from '@/utils/types';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Separator } from '@/components/ui/separator';
import FriendRequestsList from './connections/FriendRequestsList';
import SearchResultsList from './connections/SearchResultsList';
import FriendsList from './connections/FriendsList';
import { useGameData } from '@/hooks/useGameData';

interface ConnectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlayerId: string;
  onFriendRemoved?: () => void;
}

const ConnectionsModal = ({ open, onOpenChange, currentPlayerId, onFriendRemoved }: ConnectionsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedFriends, setDisplayedFriends] = useState<Player[]>([]);
  const queryClient = useQueryClient();
  
  // Fetch current user's friends
  const { data: friends = [], isLoading: loadingFriends, refetch: refetchFriends } = useQuery({
    queryKey: ['friends', currentPlayerId],
    queryFn: async () => {
      console.log('Fetching friends for user:', currentPlayerId);
      
      // This time we'll ensure we get the most up-to-date data by adding cache-busting
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          user_id,
          friend_id,
          friend:profiles!connections_friend_id_fkey(id, username, full_name, avatar_url),
          user:profiles!connections_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${currentPlayerId},friend_id.eq.${currentPlayerId}`)
        .order('id', { ascending: false }); // Order by most recent to ensure we see new changes
      
      if (error) {
        console.error('Error fetching friends:', error);
        toast({
          title: "Error",
          description: "Failed to load friends",
          variant: "destructive"
        });
        return [];
      }

      console.log('Raw friends data:', JSON.stringify(connections, null, 2));
      
      // Transform the data into the expected format
      return connections.map(conn => {
        // Determine which profile to use based on the relationship direction
        const isUserInitiator = conn.user_id === currentPlayerId;
        const profileData = isUserInitiator ? conn.friend : conn.user;
        
        // Log profile data for debugging
        console.log('Connection:', conn.id, 'Profile data:', profileData);
        
        // Handle profile data safely regardless of whether it's an array or object
        let formattedProfile = null;
        
        if (Array.isArray(profileData) && profileData.length > 0) {
          formattedProfile = profileData[0];
        } else if (profileData && typeof profileData === 'object') {
          formattedProfile = profileData;
        }
        
        if (!formattedProfile) {
          console.error('Profile data missing in connection:', conn);
          return null;
        }
        
        return {
          id: formattedProfile.id,
          name: formattedProfile.username || formattedProfile.full_name || 'Unknown User',
          avatar: formattedProfile.avatar_url,
          connectionId: conn.id, // Add connectionId to the friend object to facilitate removal
        } as Player;
      }).filter(Boolean) as Player[];
    },
    enabled: open && !!currentPlayerId,
    staleTime: 0, // Don't cache this data
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Fetch pending friend requests
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['pending-requests', currentPlayerId],
    queryFn: async () => {
      // Log the current player ID for debugging
      console.log('Fetching pending requests for player:', currentPlayerId);
      
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          user_id,
          friend_id,
          user:profiles!connections_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('friend_id', currentPlayerId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending requests:', error);
        toast({
          title: "Error",
          description: "Failed to load friend requests",
          variant: "destructive"
        });
        return [];
      }
      
      // Log the raw data for debugging
      console.log('Raw pending requests data:', JSON.stringify(data, null, 2));

      return data.map(request => {
        // First, check what type of data we're getting
        console.log('Request user data type:', typeof request.user);
        console.log('Request user data:', request.user);
        
        // Properly extract the user data from the nested structure
        let userData = null;
        
        if (Array.isArray(request.user) && request.user.length > 0) {
          userData = request.user[0];
          console.log('Extracted user data from array:', userData);
        } else if (request.user && typeof request.user === 'object') {
          userData = request.user;
          console.log('Using user data directly:', userData);
        }
        
        return {
          id: request.id,
          playerId: request.user_id,
          friendId: request.friend_id,
          playerName: userData ? (userData.username || userData.full_name || 'Unknown User') : 'Unknown User',
          playerAvatar: userData ? userData.avatar_url : undefined
        };
      });
    },
    enabled: open && !!currentPlayerId
  });

  // Search for users
  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ['search-users', searchQuery, currentPlayerId],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', currentPlayerId)
        .limit(10);
      
      if (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Error",
          description: "Failed to search users",
          variant: "destructive"
        });
        return [];
      }
      
      return data.map(profile => ({
        id: profile.id,
        name: profile.username || profile.full_name || 'Unknown User',
        avatar: profile.avatar_url
      })) as Player[];
    },
    enabled: !!searchQuery && searchQuery.length >= 2 && open
  });
  
  // Filter out users that are already friends
  const filteredSearchResults = searchResults.filter(user => 
    !displayedFriends.some(friend => friend.id === user.id)
  );
  
  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      // Check if connection already exists
      const { data: existingConn, error: checkError } = await supabase
        .from('connections')
        .select('id, status')
        .or(`and(user_id.eq.${currentPlayerId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentPlayerId})`)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking existing connection:', checkError);
        throw new Error('Failed to check connection status');
      }
      
      if (existingConn && existingConn.length > 0) {
        throw new Error('Connection already exists with this user');
      }
      
      // Add new connection
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: currentPlayerId,
          friend_id: friendId,
          status: 'pending'
        });
      
      if (error) {
        console.error('Error adding friend:', error);
        throw new Error('Failed to send friend request');
      }
      
      return friendId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent"
      });
      setSearchQuery('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send friend request',
        variant: "destructive"
      });
    }
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) {
        console.error('Error accepting friend request:', error);
        throw new Error('Failed to accept friend request');
      }

      return connectionId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request accepted"
      });
      queryClient.invalidateQueries({ queryKey: ['friends', currentPlayerId] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests', currentPlayerId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to accept friend request',
        variant: "destructive"
      });
    }
  });

  // Decline friend request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) {
        console.error('Error declining friend request:', error);
        throw new Error('Failed to decline friend request');
      }

      return connectionId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request declined"
      });
      queryClient.invalidateQueries({ queryKey: ['pending-requests', currentPlayerId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to decline friend request',
        variant: "destructive"
      });
    }
  });

  // Remove friend mutation with aggressive cache clearing
  const removeFriendMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      console.log('Removing connection with ID:', connectionId);
      
      try {
        // First, verify the connection exists
        const { data: connectionCheck, error: checkError } = await supabase
          .from('connections')
          .select('id')
          .eq('id', connectionId)
          .single();
        
        if (checkError) {
          console.error('Error checking connection:', checkError);
          throw new Error('Connection not found or could not be verified');
        }
        
        // Perform the deletion
        console.log('Found connection, attempting to delete:', connectionCheck.id);
        const { error: deleteError } = await supabase
          .from('connections')
          .delete()
          .eq('id', connectionId);
        
        if (deleteError) {
          console.error('Error removing connection:', deleteError);
          throw new Error('Failed to remove connection');
        }
        
        // Since Supabase doesn't always return the deleted rows, we assume success if no error
        console.log('Deletion completed without errors');
        return connectionId;
      } catch (error) {
        console.error('Error in remove friend mutation:', error);
        throw error;
      }
    },
    onSuccess: (connectionId) => {
      toast({
        title: "Success",
        description: "Friend removed successfully"
      });
      console.log('Successfully removed connection with ID:', connectionId);
      
      // Immediately remove the friend from the displayed list
      setDisplayedFriends(prev => prev.filter(friend => friend.connectionId !== connectionId));
      
      // Force aggressive cache removal for all friend-related queries
      queryClient.removeQueries({ queryKey: ['friends'] });
      
      // Force refetch after a short delay to ensure DB changes propagate
      setTimeout(() => {
        refetchFriends();
      }, 500);
      
      // Call the external callback if provided
      if (onFriendRemoved) {
        onFriendRemoved();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to remove friend',
        variant: "destructive"
      });
    }
  });

  const handleAddFriend = (friendId: string) => {
    addFriendMutation.mutate(friendId);
  };

  const handleAcceptRequest = (connectionId: string) => {
    acceptRequestMutation.mutate(connectionId);
  };

  const handleDeclineRequest = (connectionId: string) => {
    declineRequestMutation.mutate(connectionId);
  };
  
  const handleRemoveFriend = (connectionId: string) => {
    console.log('Handling remove friend for connection ID:', connectionId);
    
    // Verify we have a valid connection ID
    if (!connectionId) {
      toast({
        title: "Error",
        description: "Cannot remove friend: missing connection information",
        variant: "destructive"
      });
      return;
    }
    
    removeFriendMutation.mutate(connectionId);
  };

  // Update displayedFriends when friends data changes
  useEffect(() => {
    if (friends && Array.isArray(friends)) {
      console.log('Friends list received new friends data:', friends);
      setDisplayedFriends(friends);
    } else {
      setDisplayedFriends([]);
    }
  }, [friends]);

  // Force refetch when modal opens
  useEffect(() => {
    if (open && currentPlayerId) {
      // Clear displayed friends immediately when modal opens
      setDisplayedFriends([]);
      
      // Aggressively clear cache and refetch
      queryClient.removeQueries({ queryKey: ['friends', currentPlayerId] });
      
      // Wait a moment before refetching to ensure we get fresh data
      setTimeout(() => {
        refetchFriends();
      }, 100);
    }
  }, [open, currentPlayerId, queryClient, refetchFriends]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Friends</DialogTitle>
          <DialogDescription>
            Connect with friends to compare your game scores
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {/* Search for friends */}
          <div className="relative mb-4">
            <Input
              placeholder="Search for players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Friend requests section */}
          <FriendRequestsList
            pendingRequests={pendingRequests}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            isAccepting={acceptRequestMutation.isPending}
            isDeclining={declineRequestMutation.isPending}
          />

          {/* Search results section */}
          {searchQuery && searchQuery.length >= 2 && (
            <>
              <SearchResultsList
                searchQuery={searchQuery}
                searchResults={filteredSearchResults}
                onAddFriend={handleAddFriend}
                isLoading={loadingSearch}
                isAdding={addFriendMutation.isPending}
              />
              <Separator className="my-4" />
            </>
          )}

          {/* Current friends section */}
          <FriendsList
            friends={displayedFriends}
            isLoading={loadingFriends}
            onRemoveFriend={handleRemoveFriend}
            isRemoving={removeFriendMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionsModal;
