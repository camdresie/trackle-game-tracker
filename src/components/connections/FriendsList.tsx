import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserMinus } from 'lucide-react';
import { Player } from '@/utils/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useResizeObserver } from '@/hooks/useResizeObserver';

interface FriendsListProps {
  friends: Player[];
  isLoading: boolean;
  onRemoveFriend?: (connectionId: string) => void;
  isRemoving?: boolean;
}

const FRIEND_ITEM_HEIGHT = 48; // Height of each friend item in pixels

const FriendsList = ({ friends, isLoading, onRemoveFriend, isRemoving }: FriendsListProps) => {
  const [connectionToRemove, setConnectionToRemove] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(scrollContainerRef);
  
  const handleRemoveFriend = () => {
    if (connectionToRemove && onRemoveFriend) {
      onRemoveFriend(connectionToRemove);
      setConnectionToRemove(null);
    }
  };
  
  // Row renderer for virtualized list
  const FriendRow = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const friend = friends[index];
    
    return (
      <div 
        key={friend.id}
        style={style}
        className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50"
      >
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={friend.avatar || undefined} />
            <AvatarFallback>{friend.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <span>{friend.name}</span>
        </div>
        {onRemoveFriend && friend.connectionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConnectionToRemove(friend.connectionId)}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive"
          >
            <UserMinus className="h-4 w-4" />
            <span className="sr-only">Remove {friend.name}</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Your Friends
      </h3>
      <div className="flex-1 relative" ref={scrollContainerRef} style={{ minHeight: '200px' }}>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading friends...
          </div>
        ) : friends.length > 0 ? (
          width && height ? (
            <List
              height={height}
              width={width}
              itemCount={friends.length}
              itemSize={FRIEND_ITEM_HEIGHT}
            >
              {FriendRow}
            </List>
          ) : (
            <div className="space-y-2">Loading...</div>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>You don't have any friends yet</p>
            <p className="text-sm">Search for players to add them as friends</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!connectionToRemove} onOpenChange={(open) => !open && setConnectionToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? They will need to send you another friend request if you want to connect again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFriend} className="bg-destructive">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FriendsList;
