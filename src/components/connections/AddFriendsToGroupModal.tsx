import { useState, useEffect, useRef } from 'react';
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
import { UserPlus, Search, X, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { isDevelopment } from '@/utils/environment';

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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [processingFriends, setProcessingFriends] = useState<Record<string, boolean>>({});
  const [pendingInvites, setPendingInvites] = useState<Record<string, boolean>>({});
  const [invitedFriends, setInvitedFriends] = useState<Record<string, 'pending' | 'rejected'>>({});

  // Add a cleanup ref to prevent memory leaks
  const cleanupRef = useRef(false);

  // Get friends that match the search term
  const filteredFriends = availableFriends.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Check for existing pending invitations when the modal opens
  useEffect(() => {
    let isSubscribed = true;

    if (open && user && group?.id) {
      const checkPendingInvites = async () => {
        try {
          if (!isSubscribed) return;

          if (isDevelopment()) {
            console.log(`Checking pending invites for group ${group.id}`);
          }
          const { data, error } = await supabase
            .from('friend_group_members')
            .select('friend_id, status')
            .eq('group_id', group.id)
            .in('status', ['pending', 'rejected']);
            
          if (error || !isSubscribed) {
            if (error) console.error('Error checking pending invites:', error);
            return;
          }
          
          // Update pending invites state
          const pendingMap: Record<string, boolean> = {};
          const invitedMap: Record<string, 'pending' | 'rejected'> = {};
          
          data?.forEach(item => {
            pendingMap[item.friend_id] = item.status === 'pending';
            invitedMap[item.friend_id] = item.status as 'pending' | 'rejected';
          });
          
          // Also check the pendingMembers from the group prop if available
          if (group?.pendingMembers && group.pendingMembers.length > 0) {
            group.pendingMembers.forEach(member => {
              if (member.status === 'pending') {
                pendingMap[member.id] = true;
                invitedMap[member.id] = 'pending';
              } else if (member.status === 'rejected') {
                invitedMap[member.id] = 'rejected';
              }
            });
          }
          
          if (isSubscribed) {
            setPendingInvites(pendingMap);
            setInvitedFriends(invitedMap);
          }
        } catch (err) {
          console.error('Error in checkPendingInvites:', err);
        }
      };
      
      // Initial check
      checkPendingInvites();
    }

    return () => {
      isSubscribed = false;
    };
  }, [open, user, group?.id]);  // Removed group?.pendingMembers from dependencies

  // Add a cleanup ref to prevent memory leaks
  const cleanupRef2 = useRef(false);

  useEffect(() => {
    if (!open || !group) return;
    
    // Set cleanup flag to false when effect starts
    cleanupRef2.current = false;
    
    // Don't automatically close the modal for group owners, even if there are pending invites
    // Only close for non-owners who are members
    if (group?.pendingMembers && group.pendingMembers.length > 0 && !group.isOwner) {
      if (!cleanupRef2.current) {
        onOpenChange(false);
      }
    }
    
    // Cleanup function
    return () => {
      cleanupRef2.current = true;
    };
  }, [open, group, onOpenChange]);

  const handleAddFriend = (friendId: string) => {
    if (isDevelopment()) {
      console.log(`INVITATION FLOW - User clicked to add friend ${friendId} to group ${group?.id || 'unknown'}`);
    }
    
    // Set processing state for this friend
    setProcessingFriends(prev => ({ ...prev, [friendId]: true }));
    
    try {
      // Call the provided callback to add the friend
      onAddFriend(friendId);
      
      // Update pending invites (optimistically)
      setPendingInvites(prev => ({ ...prev, [friendId]: true }));
      setInvitedFriends(prev => ({ ...prev, [friendId]: 'pending' }));
      
      if (isDevelopment()) {
        console.log(`INVITATION FLOW - Invitation sent successfully to friendId=${friendId}`);
      }
    } catch (error) {
      console.error("INVITATION FLOW - Error adding friend to group:", error);
    }
    
    // Clear the processing state after a short delay (for better UX)
    setTimeout(() => {
      setProcessingFriends(prev => ({ ...prev, [friendId]: false }));
    }, 1000);
  };

  // Reset processing state when modal closes
  useEffect(() => {
    if (!open) {
      setProcessingFriends({});
      setSearchTerm('');
    }
  }, [open]);

  // Get the status badge for a friend based on their invitation status
  const getFriendStatusBadge = (friendId: string) => {
    const status = invitedFriends[friendId];
    
    if (!status) {
      return null;
    }
    
    if (status === 'pending') {
      return (
        <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Invitation Pending
        </Badge>
      );
    }
    
    if (status === 'rejected') {
      return (
        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-300">
          <X className="w-3 h-3 mr-1" />
          Invitation Declined
        </Badge>
      );
    }
    
    return null;
  };

  // Add a ref for the main container to trap focus
  const modalContainerRef = useRef<HTMLDivElement>(null);
  // Focus guard to prevent recursion
  const hasFocusedRef = useRef(false);
  // Track last focus time
  const lastFocusTimeRef = useRef(0);
  
  // Aggressive focus management to prevent recursion
  useEffect(() => {
    if (!open) return;
    
    // Function to handle focus events
    const handleFocus = (e: FocusEvent) => {
      const now = Date.now();
      
      // If we've focused recently (within 50ms), prevent focus chain
      if (now - lastFocusTimeRef.current < 50) {
        e.stopPropagation();
        // Prevent default only if we're in a potential recursion
        if (hasFocusedRef.current) {
          e.preventDefault();
        }
      }
      
      hasFocusedRef.current = true;
      lastFocusTimeRef.current = now;
      
      // Reset focus guard after a delay
      setTimeout(() => {
        hasFocusedRef.current = false;
      }, 100);
    };
    
    // Capture focus events at the capturing phase for early intervention
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focus', handleFocus, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focus', handleFocus, true);
      hasFocusedRef.current = false;
    };
  }, [open]);
  
  // Additional measure: detach event listeners when modal is closed
  useEffect(() => {
    return () => {
      if (!open) {
        // Reset all focus-related state
        hasFocusedRef.current = false;
        lastFocusTimeRef.current = 0;
      }
    };
  }, [open]);

  // Function to force focus to stay within modal
  const forceFocusWithin = () => {
    if (modalContainerRef.current && open) {
      // Only focus if we haven't focused recently
      const now = Date.now();
      if (now - lastFocusTimeRef.current > 100) {
        modalContainerRef.current.focus();
        lastFocusTimeRef.current = now;
      }
    }
  };

  // Focus the modal container when it opens
  useEffect(() => {
    if (open) {
      // Short delay to let other focus events settle
      setTimeout(forceFocusWithin, 50);
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="focus-visible:outline-none">
        <div 
          ref={modalContainerRef} 
          tabIndex={-1} 
          className="outline-none"
        >
          <DrawerHeader>
            <DrawerTitle>Add Friends to {group?.name || 'Group'}</DrawerTitle>
            <DrawerDescription>
              Select friends to add to this group to compare game stats within your cohort.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 my-2">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                {group?.members?.length || 0} Friends in group
              </Badge>
              <Badge variant="outline">
                {availableFriends.length} Available friends
              </Badge>
              {(group?.pendingMembers?.length || 0) > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {group?.pendingMembers?.length || 0} Pending
                </Badge>
              )}
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
                All your friends are already in this group or have pending invitations.
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
                        <div className="flex flex-col">
                          <span>{friend.name}</span>
                          {getFriendStatusBadge(friend.id)}
                        </div>
                      </div>
                      {pendingInvites[friend.id] ? (
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 p-0 cursor-not-allowed"
                          disabled
                        >
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="sr-only">Invitation pending for {friend.name}</span>
                        </Button>
                      ) : (
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
                      )}
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
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddFriendsToGroupModal;
