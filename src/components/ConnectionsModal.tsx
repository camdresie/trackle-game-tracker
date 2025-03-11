
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Check, X, UserPlus, Users } from 'lucide-react';
import { Player, Connection } from '@/utils/types';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ConnectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlayerId: string;
}

const ConnectionsModal = ({ open, onOpenChange, currentPlayerId }: ConnectionsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  
  // Fetch current user's friends
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends', currentPlayerId],
    queryFn: async () => {
      // Query for accepted connections where current user is either the user_id or friend_id
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          friend:friend_id(id, username, full_name, avatar_url),
          user:user_id(id, username, full_name, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${currentPlayerId},friend_id.eq.${currentPlayerId}`);
      
      if (error) {
        console.error('Error fetching friends:', error);
        toast.error('Failed to load friends');
        return [];
      }
      
      // Format friend data to match Player interface
      return connections.map(conn => {
        // If currentPlayer is the user, return the friend data, otherwise return the user data
        // First determine if the current user is the initiator of the connection
        const isUserInitiator = conn.user_id === currentPlayerId;
        const profile = isUserInitiator ? conn.friend[0] : conn.user[0];
        
        return {
          id: profile.id,
          name: profile.username || profile.full_name || 'Unknown User',
          avatar: profile.avatar_url,
        } as Player;
      });
    },
    enabled: open && !!currentPlayerId
  });
  
  // Fetch pending friend requests
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['pending-requests', currentPlayerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id, 
          user:user_id(id, username, full_name, avatar_url)
        `)
        .eq('friend_id', currentPlayerId)
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching pending requests:', error);
        toast.error('Failed to load friend requests');
        return [];
      }
      
      return data.map(request => ({
        id: request.id,
        playerId: request.user[0].id,
        friendId: currentPlayerId,
        status: 'pending',
        playerName: request.user[0].username || request.user[0].full_name || 'Unknown User',
        playerAvatar: request.user[0].avatar_url
      }));
    },
    enabled: open && !!currentPlayerId
  });
  
  // Search for users
  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ['search-users', searchQuery, currentPlayerId],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      // Query profiles that match the search term
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', currentPlayerId) // Exclude current user
        .limit(10);
      
      if (error) {
        console.error('Error searching users:', error);
        toast.error('Failed to search users');
        return [];
      }
      
      // Format search results to match Player interface
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
    !friends.some(friend => friend.id === user.id)
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
      toast.success('Friend request sent');
      setSearchQuery('');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send friend request');
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
      toast.success('Friend request accepted');
      queryClient.invalidateQueries({ queryKey: ['friends', currentPlayerId] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests', currentPlayerId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to accept friend request');
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
      toast.success('Friend request declined');
      queryClient.invalidateQueries({ queryKey: ['pending-requests', currentPlayerId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to decline friend request');
    }
  });
  
  // Handle adding a friend
  const handleAddFriend = (friendId: string) => {
    addFriendMutation.mutate(friendId);
  };
  
  // Handle accepting a friend request
  const handleAcceptRequest = (connectionId: string) => {
    acceptRequestMutation.mutate(connectionId);
  };
  
  // Handle declining a friend request
  const handleDeclineRequest = (connectionId: string) => {
    declineRequestMutation.mutate(connectionId);
  };
  
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
          
          {/* Search results */}
          {searchQuery && searchQuery.length >= 2 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Search Results
              </h3>
              <ScrollArea className="h-32">
                {loadingSearch ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : filteredSearchResults.length > 0 ? (
                  <div className="space-y-2">
                    {filteredSearchResults.map(player => (
                      <div 
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.avatar || undefined} />
                            <AvatarFallback>{player.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <span>{player.name}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleAddFriend(player.id)}
                          disabled={addFriendMutation.isPending}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No users found matching '{searchQuery}'
                  </div>
                )}
              </ScrollArea>
              <Separator className="my-4" />
            </div>
          )}
          
          {/* Friend requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Friend Requests</h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {pendingRequests.map(request => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={request.playerAvatar || undefined} />
                          <AvatarFallback>
                            {request.playerName?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{request.playerName}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-green-500"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={acceptRequestMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-rose-500"
                          onClick={() => handleDeclineRequest(request.id)}
                          disabled={declineRequestMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator className="my-4" />
            </div>
          )}
          
          {/* Current friends */}
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Your Friends
          </h3>
          <ScrollArea className="flex-1">
            {loadingFriends ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading friends...
              </div>
            ) : friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map(friend => (
                  <div 
                    key={friend.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.avatar || undefined} />
                      <AvatarFallback>{friend.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span>{friend.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>You don't have any friends yet</p>
                <p className="text-sm">Search for players to add them as friends</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionsModal;
