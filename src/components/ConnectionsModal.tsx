
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
import { Badge } from '@/components/ui/badge';
import { Player, Connection } from '@/utils/types';
import { getPlayerFriends, players, connections, addConnection } from '@/utils/gameData';
import { toast } from 'sonner';
import { Plus, Check, X, UserPlus, Users } from 'lucide-react';

interface ConnectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlayerId: string;
}

const ConnectionsModal = ({ open, onOpenChange, currentPlayerId }: ConnectionsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Player[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  
  useEffect(() => {
    if (open) {
      // Get current friends
      setFriends(getPlayerFriends(currentPlayerId));
      
      // Get pending connection requests
      setPendingRequests(
        connections.filter(conn => 
          conn.friendId === currentPlayerId && 
          conn.status === 'pending'
        )
      );
    }
  }, [open, currentPlayerId]);
  
  const handleAddFriend = (friendId: string) => {
    // Check if connection already exists
    const connectionExists = connections.some(
      conn => 
        (conn.playerId === currentPlayerId && conn.friendId === friendId) ||
        (conn.playerId === friendId && conn.friendId === currentPlayerId)
    );
    
    if (connectionExists) {
      toast.error('Connection already exists with this player');
      return;
    }
    
    // Add new connection
    addConnection(currentPlayerId, friendId);
    toast.success('Friend request sent');
    setSearchQuery('');
  };
  
  const handleAcceptRequest = (connectionId: string) => {
    // Find and update the connection status
    const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
    if (connectionIndex !== -1) {
      connections[connectionIndex].status = 'accepted';
      
      // Update the friends list
      setFriends(getPlayerFriends(currentPlayerId));
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      
      toast.success('Friend request accepted');
    }
  };
  
  const handleDeclineRequest = (connectionId: string) => {
    // Remove the connection
    const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
    if (connectionIndex !== -1) {
      connections.splice(connectionIndex, 1);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      
      toast.success('Friend request declined');
    }
  };
  
  // Filter players based on search query
  const filteredPlayers = searchQuery
    ? players.filter(
        player => 
          player.id !== currentPlayerId &&
          player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !friends.some(friend => friend.id === player.id)
      )
    : [];
  
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
          {searchQuery && filteredPlayers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Search Results
              </h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {filteredPlayers.map(player => (
                    <div 
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{player.name}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleAddFriend(player.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
                  {pendingRequests.map(request => {
                    const requestFrom = players.find(p => p.id === request.playerId);
                    if (!requestFrom) return null;
                    
                    return (
                      <div 
                        key={request.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={requestFrom.avatar} />
                            <AvatarFallback>{requestFrom.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span>{requestFrom.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-green-500"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-rose-500"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
            {friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map(friend => (
                  <div 
                    key={friend.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
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
