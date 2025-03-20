
import { useState, useEffect } from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FriendGroup, Player } from '@/utils/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, X, Check } from 'lucide-react';

interface AddFriendsToGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: FriendGroup;
  availableFriends: Player[];
  onAddFriend: (friendId: string) => void;
}

const AddFriendsToGroupModal = ({
  open,
  onOpenChange,
  group,
  availableFriends,
  onAddFriend
}: AddFriendsToGroupModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingFriends, setProcessingFriends] = useState<Record<string, boolean>>({});

  const filteredFriends = availableFriends.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFriend = (friendId: string) => {
    // Set processing state for this friend
    setProcessingFriends(prev => ({ ...prev, [friendId]: true }));
    
    // Call the provided callback to add the friend
    onAddFriend(friendId);
    
    // Clear the processing state after a short delay (for better UX)
    setTimeout(() => {
      setProcessingFriends(prev => ({ ...prev, [friendId]: false }));
    }, 1000);
  };

  // Reset processing state when modal closes
  useEffect(() => {
    if (!open) {
      setProcessingFriends({});
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Friends to {group.name}</DrawerTitle>
          <DrawerDescription>
            Select friends to add to this group to compare game stats within your cohort.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 my-2">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {group.members?.length || 0} Friends in group
            </Badge>
            <Badge variant="outline">
              {availableFriends.length} Available friends
            </Badge>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search friends..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <X 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 cursor-pointer" 
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>

          {availableFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              All your friends are already in this group.
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No friends match your search.
            </div>
          ) : (
            <ScrollArea className="h-[50vh] rounded-md border p-2">
              <div className="space-y-2">
                {filteredFriends.map(friend => (
                  <div 
                    key={friend.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>{friend.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <span>{friend.name}</span>
                    </div>
                    <Button
                      variant={processingFriends[friend.id] ? "outline" : "ghost"}
                      size="icon"
                      onClick={() => handleAddFriend(friend.id)}
                      className="w-8 h-8 p-0"
                      disabled={processingFriends[friend.id]}
                    >
                      {processingFriends[friend.id] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      <span className="sr-only">Add {friend.name}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button">
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AddFriendsToGroupModal;
