
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Player } from '@/utils/types';
import FriendRequestsList from './FriendRequestsList';
import SearchResultsList from './SearchResultsList';
import FriendsList from './FriendsList';
import { useConnectionSearch } from '@/hooks/connections/useConnectionSearch';
import { useConnectionRequests } from '@/hooks/connections/useConnectionRequests';
import { useConnections } from '@/hooks/connections/useConnections';
import { useConnectionMutations } from '@/hooks/connections/useConnectionMutations';

interface FriendsTabContentProps {
  currentPlayerId: string;
  open: boolean;
  onFriendRemoved?: () => void;
}

const FriendsTabContent = ({ currentPlayerId, open, onFriendRemoved }: FriendsTabContentProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Use the extracted hooks with simplified dependencies
  const { 
    data: friends = [], 
    isLoading: loadingFriends,
    refetch: refetchFriends 
  } = useConnections(currentPlayerId, open);
  
  const { 
    data: pendingRequests = [], 
    isLoading: loadingRequests 
  } = useConnectionRequests(currentPlayerId, open);
  
  const { 
    data: searchResults = [], 
    isLoading: loadingSearch 
  } = useConnectionSearch(searchQuery, currentPlayerId, open && searchQuery.length >= 2);

  const {
    addFriend,
    isAddingFriend,
    acceptRequest,
    isAcceptingRequest,
    declineRequest,
    isDecliningRequest,
    removeFriend,
    isRemovingFriend
  } = useConnectionMutations(currentPlayerId, onFriendRemoved);

  // Filter out users that are already friends
  const filteredSearchResults = searchResults.filter(user => 
    !friends.some(friend => friend.id === user.id)
  );

  // Simplified effect to refresh data when the tab opens
  useEffect(() => {
    if (open && currentPlayerId) {
      console.log('Friends tab opened, fetching fresh data');
      
      // Simple timeout to ensure DB consistency
      const timer = setTimeout(() => {
        refetchFriends()
          .then(() => console.log('Friends data refetch completed'))
          .catch(error => console.error('Error during friends refetch:', error));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [open, currentPlayerId, refetchFriends]);

  const handleRemoveFriend = (connectionId: string) => {
    console.log('Handling remove friend for connection ID:', connectionId);
    
    if (!connectionId) {
      console.error("Cannot remove friend: missing connection information");
      return;
    }
    
    removeFriend(connectionId);
  };

  return (
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
        onAccept={acceptRequest}
        onDecline={declineRequest}
        isAccepting={isAcceptingRequest}
        isDeclining={isDecliningRequest}
      />

      {/* Search results section */}
      {searchQuery && searchQuery.length >= 2 && (
        <>
          <SearchResultsList
            searchQuery={searchQuery}
            searchResults={filteredSearchResults}
            onAddFriend={addFriend}
            isLoading={loadingSearch}
            isAdding={isAddingFriend}
          />
          <Separator className="my-4" />
        </>
      )}

      {/* Current friends section */}
      <FriendsList
        friends={friends}
        isLoading={loadingFriends}
        onRemoveFriend={handleRemoveFriend}
        isRemoving={isRemovingFriend}
      />
    </div>
  );
};

export default FriendsTabContent;
