
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { Player } from '@/utils/types';

interface FriendsListProps {
  friends: Player[];
  isLoading: boolean;
}

const FriendsList = ({ friends, isLoading }: FriendsListProps) => {
  return (
    <>
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Your Friends
      </h3>
      <ScrollArea className="flex-1">
        {isLoading ? (
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
    </>
  );
};

export default FriendsList;
