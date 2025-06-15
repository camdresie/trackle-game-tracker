import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PlusCircle, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus, 
  Users, 
  MessageCircle,
  Clock,
  UsersRound,
  LogOut
} from 'lucide-react';
import { FriendGroup, Player } from '@/utils/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import FriendGroupModal from './FriendGroupModal';
import AddFriendsToGroupModal from './AddFriendsToGroupModal';
import GroupMessagesModal from '@/components/messages/GroupMessagesModal';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { useConnections } from '@/hooks/connections/useConnections';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { isDevelopment } from '@/utils/environment';

interface FriendGroupsManagerProps {
  currentPlayerId: string;
  open: boolean;
}

const FriendGroupsManager = ({ currentPlayerId, open }: FriendGroupsManagerProps) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addFriendsModalOpen, setAddFriendsModalOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<any | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [groupToLeave, setGroupToLeave] = useState<string | null>(null);
  const [isProcessingLeave, setIsProcessingLeave] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const queryClient = useQueryClient();
  const hasFetchedRef = useRef(false);
  const cleanupRef = useRef(false);

  // Add a ref to track focus state
  const focusTimeRef = useRef(0);
  const isProcessingFocusRef = useRef(false);

  // Fetch friends to use with groups
  const { data: friends = [], isLoading: isLoadingFriends } = useConnections(currentPlayerId, open);

  // Use the friend groups hook
  const {
    friendGroups,
    isLoading: isLoadingGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    addFriendToGroup,
    removeFriendFromGroup,
    leaveGroup,
    refetch: refetchGroups
  } = useFriendGroups(friends);
  
  // Get group invitations
  const { 
    invitations, 
    isLoading: isLoadingInvitations,
    acceptInvitation,
    declineInvitation,
    refetch: refetchInvitations,
  } = useGroupInvitations();

  // Ensure we fetch the latest groups and invitations when the modal opens
  useEffect(() => {
    if (open && !hasFetchedRef.current) {
      
      // Set cleanup flag to false when effect starts
      cleanupRef.current = false;
      
      // Clear cache before fetching
      if (!cleanupRef.current) {
        queryClient.removeQueries({ queryKey: ['group-invitations'] });
        queryClient.removeQueries({ queryKey: ['friend-groups'] });
        queryClient.removeQueries({ queryKey: ['group-members'] });
        queryClient.removeQueries({ queryKey: ['member-profiles'] });
        
        // Force a hard refresh of the data
        Promise.all([
          refetchInvitations(),
          refetchGroups()
        ]).catch(error => {
          if (!cleanupRef.current) {
            console.error('Error fetching initial data:', error);
          }
        });
        
        // Mark that we've fetched data
        hasFetchedRef.current = true;
      }
    } else if (!open) {
      // Reset the ref when the modal closes
      hasFetchedRef.current = false;
    }
    
    // Cleanup function
    return () => {
      cleanupRef.current = true;
    };
  }, [open, refetchInvitations, refetchGroups, queryClient]);

  // Add global focus management to prevent infinite recursion
  useEffect(() => {
    if (!open) return;
    
    // Handle all focus events globally
    const handleGlobalFocus = (e: Event) => {
      const now = Date.now();
      
      // If focus events are happening too quickly (less than 50ms apart), 
      // it might be a recursion issue
      if (now - focusTimeRef.current < 50 && isProcessingFocusRef.current) {
        e.stopPropagation();
        
        // If it's targeting dropdown or drawer, prevent default to break cycle
        const target = e.target as HTMLElement;
        if (target?.closest('[data-radix-dropdown-menu]') || 
            target?.closest('[role="dialog"]')) {
          e.preventDefault();
        }
      }
      
      isProcessingFocusRef.current = true;
      focusTimeRef.current = now;
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isProcessingFocusRef.current = false;
      }, 100);
    };
    
    // Capture at the document level to intercept all focus events
    document.addEventListener('focusin', handleGlobalFocus, true);
    document.addEventListener('focus', handleGlobalFocus, true);
    
    return () => {
      document.removeEventListener('focusin', handleGlobalFocus, true);
      document.removeEventListener('focus', handleGlobalFocus, true);
      isProcessingFocusRef.current = false;
    };
  }, [open]);

  // Add a more targeted approach to fix dropdown focus issues
  useEffect(() => {
    if (!open) return;
    
    let debounceTimeout: ReturnType<typeof setTimeout>;
    let lastFocusTime = 0;
    
    // Function to handle focus events on dropdown trigger elements
    const preventDropdownFocusRecursion = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if this is a dropdown trigger or dropdown content
      if (target?.closest('[data-state="open"]') || 
          target?.closest('[role="menu"]') ||
          target?.closest('[data-radix-dropdown-menu-content-wrapper]')) {
        
        const now = Date.now();
        
        // If we're focusing elements too rapidly, this might be a recursion
        if (now - lastFocusTime < 80) {
          // Prevent the focus event from propagating
          e.stopPropagation();
          
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }
          
          // After a delay, try to focus on a safe element instead
          debounceTimeout = setTimeout(() => {
            // Try to find a safe place to focus
            const safeElement = document.querySelector('body');
            if (safeElement && document.activeElement !== safeElement) {
              (safeElement as HTMLElement).focus();
            }
          }, 100);
        }
        
        lastFocusTime = now;
      }
    };
    
    // Add the event listener with the capture phase
    document.addEventListener('focusin', preventDropdownFocusRecursion, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('focusin', preventDropdownFocusRecursion, true);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [open]);

  // Optimize modal state management
  const handleModalStateChange = useCallback((modalType: string, state: boolean) => {
    switch (modalType) {
      case 'create':
        setCreateModalOpen(state);
        if (state) {
          setEditModalOpen(false);
          setAddFriendsModalOpen(false);
          setMessagesModalOpen(false);
        }
        break;
      case 'edit':
        setEditModalOpen(state);
        if (state) {
          setCreateModalOpen(false);
          setAddFriendsModalOpen(false);
          setMessagesModalOpen(false);
        }
        break;
      case 'addFriends':
        setAddFriendsModalOpen(state);
        if (state) {
          setCreateModalOpen(false);
          setEditModalOpen(false);
          setMessagesModalOpen(false);
        }
        break;
      case 'messages':
        setMessagesModalOpen(state);
        if (state) {
          setCreateModalOpen(false);
          setEditModalOpen(false);
          setAddFriendsModalOpen(false);
        }
        break;
    }
  }, []);

  // Update modal handlers to use the new function
  const handleEditGroup = useCallback((group: any) => {
    setCurrentGroup(group);
    handleModalStateChange('edit', true);
  }, [handleModalStateChange]);

  const handleAddFriendsToGroup = useCallback((group: FriendGroup) => {
    if (!group) {
      console.error('handleAddFriendsToGroup: group is null');
      return;
    }
    
    setCurrentGroup(group);
    handleModalStateChange('addFriends', true);
  }, [handleModalStateChange]);

  const handleOpenMessages = useCallback((group: any) => {
    setCurrentGroup(group);
    handleModalStateChange('messages', true);
  }, [handleModalStateChange]);

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDelete(null);
    deleteGroup(groupId);
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      setIsProcessingLeave(true);
      if (isDevelopment()) {
        console.log('Leaving group:', groupId);
      }
      
      // Clear cache before leaving
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      queryClient.removeQueries({ queryKey: ['group-members'] });
      queryClient.removeQueries({ queryKey: ['member-profiles'] });
      
      // Call the leaveGroup function
      await leaveGroup(groupId);
      
      // Force refetch groups
      await refetchGroups();
      
      // Clear cache again after refetching
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      queryClient.removeQueries({ queryKey: ['group-members'] });
      queryClient.removeQueries({ queryKey: ['member-profiles'] });
      
      // Force one final refetch after a short delay
      setTimeout(async () => {
        await refetchGroups();
        setIsProcessingLeave(false);
      }, 1000);
      
      toast.success('You have left the group');
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
      setIsProcessingLeave(false);
    }
  };

  const handleUpdateGroup = (data: { name: string, description: string }) => {
    if (currentGroup) {
      updateGroup({
        id: currentGroup.id,
        name: data.name,
        description: data.description
      });
    }
  };

  // Handle accepting a group invitation
  const handleAcceptInvitation = async (invitationId: string) => {
    if (processingInvitation) {
      if (isDevelopment()) {
        console.log('Already processing an invitation, aborting');
      }
      return;
    }
    
    setProcessingInvitation(true);
    toast.info('Processing invitation...');
    
    try {
      if (isDevelopment()) {
        console.log('Accepting invitation from groups manager:', invitationId);
      }
      
      // Clear all related caches first
      queryClient.removeQueries({ queryKey: ['group-invitations'] });
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      queryClient.removeQueries({ queryKey: ['social-data'] });
      queryClient.removeQueries({ queryKey: ['notification-counts'] });
      queryClient.removeQueries({ queryKey: ['group-members'] });
      queryClient.removeQueries({ queryKey: ['member-profiles'] });
      
      // Accept the invitation
      await acceptInvitation(invitationId);
      
      // Force refetch all related data
      await Promise.all([
        refetchGroups(),
        refetchInvitations()
      ]);
      
      // Clear caches again after refetching
      queryClient.removeQueries({ queryKey: ['group-invitations'] });
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      queryClient.removeQueries({ queryKey: ['social-data'] });
      queryClient.removeQueries({ queryKey: ['notification-counts'] });
      queryClient.removeQueries({ queryKey: ['group-members'] });
      queryClient.removeQueries({ queryKey: ['member-profiles'] });
      
      // Force one final refetch after a short delay to ensure everything is in sync
      setTimeout(async () => {
        if (isDevelopment()) {
          console.log('Final refetch after accepting invitation');
        }
        await Promise.all([
          refetchGroups(),
          refetchInvitations()
        ]);
        setProcessingInvitation(false);
      }, 1000);
    } catch (error) {
      console.error('Error handling invitation accept:', error);
      toast.error('Failed to process invitation');
      setProcessingInvitation(false);
    }
  };

  // Get friends who are not in a group
  const getFriendsNotInGroup = (groupId: string) => {
    const group = friendGroups.find(g => g.id === groupId);
    if (!group || !group.members) return friends;
    
    const memberIds = new Set([
      // Include the group creator's ID
      group.user_id,
      ...(group.members || []).map(m => m.id),
      ...(group.pendingMembers || []).map(m => m.id)
    ]);
    
    return friends.filter(friend => !memberIds.has(friend.id));
  };

  const isLoading = isLoadingGroups || isLoadingFriends || isProcessingLeave || processingInvitation;

  // Modify dropdown handler to prevent focus cycling
  const handleDropdownToggle = (open: boolean) => {
    // Add a small delay before toggling to prevent rapid focus changes
    if (isProcessingFocusRef.current) {
      setTimeout(() => {
        setIsDropdownOpen(open);
      }, 50);
    } else {
      setIsDropdownOpen(open);
    }
  };

  return (
    <div className="space-y-4">
      {/* Group Invitations */}
      <GroupInvitationsList 
        invitations={invitations}
        isLoading={isLoadingInvitations || processingInvitation}
        onAccept={handleAcceptInvitation}
        onDecline={declineInvitation}
        alwaysShow={true}
      />
      
      {/* Friend Groups */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Your Groups</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleModalStateChange('create', true)}
            disabled={isLoadingGroups || isProcessingLeave}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
        
        {isLoadingGroups || isProcessingLeave ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : friendGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <Users className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">
                You don't have any groups yet. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col space-y-4">
            {friendGroups.map((group) => (
              <Card key={group.id} className="w-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription>{group.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu onOpenChange={handleDropdownToggle}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" forceMount>
                        <DropdownMenuItem onClick={() => handleOpenMessages(group)}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Messages
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddFriendsToGroup(group)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Friends
                        </DropdownMenuItem>
                        {group.isOwner ? (
                          <>
                            <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Group
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setGroupToDelete(group.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Group
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => setGroupToLeave(group.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Leave Group
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {group.members && group.members.length > 0 ? (
                      group.members.map((member) => (
                        <Badge key={member.id} variant="outline">
                          {member.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => handleOpenMessages(group)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAddFriendsToGroup(group)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Friends
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Group Modal */}
      <FriendGroupModal
        open={createModalOpen}
        onOpenChange={(open) => handleModalStateChange('create', open)}
        onSubmit={createGroup}
      />
      
      {/* Edit Group Modal */}
      <FriendGroupModal
        open={editModalOpen}
        onOpenChange={(open) => handleModalStateChange('edit', open)}
        onSubmit={handleUpdateGroup}
        initialData={currentGroup}
      />
      
      {/* Add Friends to Group Modal */}
      <AddFriendsToGroupModal
        open={addFriendsModalOpen}
        onOpenChange={(open) => handleModalStateChange('addFriends', open)}
        group={currentGroup}
        availableFriends={getFriendsNotInGroup(currentGroup?.id)}
        onAddFriend={(friendId) => addFriendToGroup({ groupId: currentGroup?.id, friendId })}
      />
      
      {/* Group Messages Modal */}
      <GroupMessagesModal
        open={messagesModalOpen}
        onOpenChange={(open) => handleModalStateChange('messages', open)}
        groupId={currentGroup?.id}
        groupName={currentGroup?.name}
      />
      
      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => groupToDelete && handleDeleteGroup(groupToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Leave Group Confirmation Dialog */}
      <AlertDialog open={!!groupToLeave} onOpenChange={(open) => !open && setGroupToLeave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You'll need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingLeave}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => groupToLeave && handleLeaveGroup(groupToLeave)}
              disabled={isProcessingLeave}
            >
              {isProcessingLeave ? 'Leaving...' : 'Leave Group'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FriendGroupsManager;
