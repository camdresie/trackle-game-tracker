
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FriendGroup, Player } from '@/utils/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, X } from 'lucide-react';

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

  const filteredFriends = availableFriends.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFriend = (friendId: string) => {
    onAddFriend(friendId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friends to {group.name}</DialogTitle>
          <DialogDescription>
            Select friends to add to this group to compare game stats within your cohort.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2">
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
            <ScrollArea className="h-64 rounded-md border p-2">
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
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddFriend(friend.id)}
                      className="gap-1"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="sr-only">Add {friend.name}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendsToGroupModal;
