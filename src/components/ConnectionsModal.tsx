
import { useState } from 'react';
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

interface ConnectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlayerId: string;
  onFriendRemoved?: () => void;
}

const ConnectionsModal = ({ open, onOpenChange, currentPlayerId, onFriendRemoved }: ConnectionsModalProps) => {
  const [activeTab, setActiveTab] = useState<string>('friends');
  const queryClient = useQueryClient();
  
  // When the modal opens, invalidate relevant queries to ensure fresh data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Clear cache to ensure fresh data
      queryClient.removeQueries({ queryKey: ['friends'] });
      queryClient.removeQueries({ queryKey: ['game-friends'] });
      queryClient.removeQueries({ queryKey: ['pending-requests'] });
    }
    
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Friends</DialogTitle>
          <DialogDescription>
            Connect with friends to compare your game scores
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="friends"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
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
