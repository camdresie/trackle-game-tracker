import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryClient } from '@tanstack/react-query';
import FriendsTabContent from './connections/FriendsTabContent';
import FriendGroupsManager from './connections/FriendGroupsManager';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { Badge } from '@/components/ui/badge';

interface ConnectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlayerId: string;
  onFriendRemoved?: () => void;
  defaultTab?: string;
}

const ConnectionsModal = ({ 
  open, 
  onOpenChange, 
  currentPlayerId, 
  onFriendRemoved,
  defaultTab = 'friends' 
}: ConnectionsModalProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const queryClient = useQueryClient();
  const { data: notificationCounts } = useNotificationCounts();
  
  // Set the active tab when defaultTab prop changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  // When the modal opens, invalidate relevant queries to ensure fresh data
  useEffect(() => {
    if (open) {
      // Clear cache to ensure fresh data
      queryClient.removeQueries({ queryKey: ['friends'] });
      queryClient.removeQueries({ queryKey: ['game-friends'] });
      queryClient.removeQueries({ queryKey: ['pending-requests'] });
      queryClient.removeQueries({ queryKey: ['group-invitations'] });
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      queryClient.removeQueries({ queryKey: ['notification-counts'] });
    }
  }, [open, queryClient]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Friends</DialogTitle>
          <DialogDescription>
            Connect with friends to compare your game scores
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={defaultTab}
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              Friends
              {notificationCounts?.friendRequests > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {notificationCounts.friendRequests}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              Groups
              {notificationCounts?.groupInvites > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {notificationCounts.groupInvites}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="flex-1 min-h-0 flex flex-col">
            <FriendsTabContent 
              currentPlayerId={currentPlayerId}
              open={open && activeTab === 'friends'}
              onFriendRemoved={onFriendRemoved}
            />
          </TabsContent>

          <TabsContent value="groups" className="flex-1 min-h-0 overflow-y-auto pr-2">
            <FriendGroupsManager
              currentPlayerId={currentPlayerId}
              open={open && activeTab === 'groups'}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionsModal;
