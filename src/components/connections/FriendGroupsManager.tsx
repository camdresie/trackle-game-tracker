
import { useState } from 'react';
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
import { Player } from '@/utils/types';
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

  const handleEditGroup = (group: any) => {
    setCurrentGroup(group);
    setEditModalOpen(true);
  };

  const handleAddFriendsToGroup = (group: any) => {
    setCurrentGroup(group);
    setAddFriendsModalOpen(true);
  };

  const handleOpenMessages = (group: any) => {
    setCurrentGroup(group);
    setMessagesModalOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDelete(null);
    deleteGroup(groupId);
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      setIsProcessingLeave(true);
      console.log('Initiating leave group process for group:', groupId);
      
      // Call the leaveGroup mutation
      await leaveGroup(groupId);
      
      // Close the dialog
      setGroupToLeave(null);
      
      // Manually refetch groups after a short delay to ensure database has updated
      setTimeout(() => {
        console.log('Refetching groups after leaving');
        refetchGroups();
        setIsProcessingLeave(false);
      }, 1000);
    } catch (error) {
      console.error('Error in handleLeaveGroup:', error);
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

  // Get friends who are not in a group
  const getFriendsNotInGroup = (groupId: string) => {
    const group = friendGroups.find(g => g.id === groupId);
    if (!group || !group.members) return friends;
    
    const memberIds = new Set([
      ...(group.members || []).map(m => m.id),
      ...(group.pendingMembers || []).map(m => m.id)
    ]);
    
    return friends.filter(friend => !memberIds.has(friend.id));
  };

  const isLoading = isLoadingGroups || isLoadingFriends || isProcessingLeave;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>Friend Groups</span>
        </h2>
        <Button 
          onClick={() => setCreateModalOpen(true)}
          size="sm"
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Group</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading friend groups...
        </div>
      ) : friendGroups.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Friend Groups Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create groups to organize your friends and compare game scores within specific cohorts.
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {friendGroups.map(group => (
            <Card key={group.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.name}
                      {group.isJoinedGroup && (
                        <Badge variant="outline" className="ml-1 bg-secondary/30">
                          Joined
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenMessages(group)}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span>Messages</span>
                      </DropdownMenuItem>
                      {group.isJoinedGroup ? (
                        <DropdownMenuItem 
                          onClick={() => setGroupToLeave(group.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Leave Group</span>
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Group</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddFriendsToGroup(group)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Add Friends</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setGroupToDelete(group.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Group</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {group.description && (
                  <CardDescription>{group.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-secondary/50">
                      <UsersRound className="mr-1 h-3 w-3" />
                      {group.members?.length || 0} {(group.members?.length || 0) === 1 ? 'Friend' : 'Friends'}
                    </Badge>
                    
                    {/* Show pending invitations badge */}
                    {!group.isJoinedGroup && group.pendingCount > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        <Clock className="mr-1 h-3 w-3" />
                        {group.pendingCount} Pending
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleOpenMessages(group)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Messages</span>
                  </Button>
                </div>
                
                {/* Show members */}
                <div className="space-y-3">
                  {/* Active Members */}
                  <div>
                    <h4 className="text-sm font-medium mb-1 text-muted-foreground">Members</h4>
                    <div className="flex flex-wrap gap-1">
                      {group.members && group.members.length > 0 ? (
                        group.members.map(member => (
                          <div key={member.id} className="relative group">
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{member.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            {!group.isJoinedGroup && (
                              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-4 w-4 rounded-full"
                                  onClick={() => removeFriendFromGroup({ groupId: group.id, friendId: member.id })}
                                >
                                  <Trash2 className="h-2 w-2" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">
                          No friends in this group yet
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Pending Invitations - only shown for groups you own */}
                  {!group.isJoinedGroup && group.pendingMembers && group.pendingMembers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Pending Invitations</span>
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {group.pendingMembers.map(member => (
                          <div key={member.id} className="relative group">
                            <Avatar className="h-8 w-8 border-2 border-yellow-100 opacity-60">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{member.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-4 w-4 rounded-full"
                                onClick={() => removeFriendFromGroup({ groupId: group.id, friendId: member.id })}
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              {!group.isJoinedGroup && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleAddFriendsToGroup(group)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Add Friends</span>
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <FriendGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={createGroup}
      />

      {/* Edit Group Modal */}
      <FriendGroupModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSubmit={handleUpdateGroup}
        isEditing={true}
        initialData={currentGroup || undefined}
      />

      {/* Add Friends to Group Modal */}
      {currentGroup && (
        <AddFriendsToGroupModal
          open={addFriendsModalOpen}
          onOpenChange={setAddFriendsModalOpen}
          group={currentGroup}
          availableFriends={getFriendsNotInGroup(currentGroup.id)}
          onAddFriend={(friendId) => addFriendToGroup({ groupId: currentGroup.id, friendId })}
        />
      )}

      {/* Messages Modal */}
      {currentGroup && (
        <GroupMessagesModal
          open={messagesModalOpen}
          onOpenChange={setMessagesModalOpen}
          groupId={currentGroup.id}
          groupName={currentGroup.name}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Friend Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this friend group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => groupToDelete && handleDeleteGroup(groupToDelete)} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation Dialog */}
      <AlertDialog open={!!groupToLeave} onOpenChange={(open) => !open && setGroupToLeave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Friend Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this friend group? You'll need a new invitation to join again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingLeave}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => groupToLeave && handleLeaveGroup(groupToLeave)} 
              className="bg-destructive"
              disabled={isProcessingLeave}
            >
              {isProcessingLeave ? 'Leaving...' : 'Leave Group'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FriendGroupsManager;
