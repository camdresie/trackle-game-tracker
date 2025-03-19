
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  PlusCircle, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus, 
  Users, 
  MessageCircle 
} from 'lucide-react';
import { FriendGroup, Player } from '@/utils/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FriendGroupModal from './FriendGroupModal';
import AddFriendsToGroupModal from './AddFriendsToGroupModal';
import GroupMessagesModal from '@/components/messages/GroupMessagesModal';
import { Badge } from '@/components/ui/badge';
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

interface FriendGroupsManagerProps {
  friendGroups: FriendGroup[];
  isLoading: boolean;
  availableFriends: Player[];
  onCreateGroup: (data: { name: string, description: string }) => void;
  onUpdateGroup: (data: { id: string, name: string, description?: string }) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddFriendToGroup: (groupId: string, friendId: string) => void;
  onRemoveFriendFromGroup: (groupId: string, friendId: string) => void;
}

const FriendGroupsManager = ({
  friendGroups,
  isLoading,
  availableFriends,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddFriendToGroup,
  onRemoveFriendFromGroup
}: FriendGroupsManagerProps) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addFriendsModalOpen, setAddFriendsModalOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<FriendGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const handleEditGroup = (group: FriendGroup) => {
    setCurrentGroup(group);
    setEditModalOpen(true);
  };

  const handleAddFriendsToGroup = (group: FriendGroup) => {
    setCurrentGroup(group);
    setAddFriendsModalOpen(true);
  };

  const handleOpenMessages = (group: FriendGroup) => {
    setCurrentGroup(group);
    setMessagesModalOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDelete(null);
    onDeleteGroup(groupId);
  };

  const handleUpdateGroup = (data: { name: string, description: string }) => {
    if (currentGroup) {
      onUpdateGroup({
        id: currentGroup.id,
        name: data.name,
        description: data.description
      });
    }
  };

  // Get friends who are not in a group
  const getFriendsNotInGroup = (groupId: string) => {
    const group = friendGroups.find(g => g.id === groupId);
    if (!group || !group.members) return availableFriends;
    
    return availableFriends.filter(friend => 
      !group.members?.some(member => member.id === friend.id)
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friend Groups
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
                  <CardTitle className="text-lg">{group.name}</CardTitle>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {group.description && (
                  <CardDescription>{group.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex justify-between items-center">
                  <Badge variant="outline" className="bg-secondary/50">
                    {group.members?.length || 0} {(group.members?.length || 0) === 1 ? 'Friend' : 'Friends'}
                  </Badge>
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
                <div className="flex flex-wrap gap-1">
                  {group.members && group.members.length > 0 ? (
                    group.members.map(member => (
                      <div key={member.id} className="relative group">
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-4 w-4 rounded-full"
                            onClick={() => onRemoveFriendFromGroup(group.id, member.id)}
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground py-2">
                      No friends in this group yet
                    </div>
                  )}
                </div>
              </CardContent>
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
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <FriendGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={onCreateGroup}
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
          onAddFriend={(friendId) => onAddFriendToGroup(currentGroup.id, friendId)}
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
    </>
  );
};

export default FriendGroupsManager;
