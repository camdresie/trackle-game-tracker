import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { useQueryClient } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MessagesPanel from '@/components/messages/MessagesPanel';
import ConnectionsModal from '@/components/ConnectionsModal';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { MessageCircle, RotateCw, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import GroupDropdownSelector from '@/components/messages/GroupDropdownSelector';

const Messages = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { friends, refreshFriends } = useFriendsList();
  const { 
    friendGroups,
    isLoading: isGroupsLoading, 
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
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [invitationsInitialized, setInvitationsInitialized] = useState(false);
  const [acceptedInvitation, setAcceptedInvitation] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState(false);
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle friends loading state
  useEffect(() => {
    if (friends) {
      setIsLoadingFriends(false);
    }
  }, [friends]);

  // Ensure we fetch the latest groups and invitations when the component mounts
  useEffect(() => {
    if (user) {
      // Clear cache before fetching
      queryClient.removeQueries({ queryKey: ['group-invitations'] });
      queryClient.removeQueries({ queryKey: ['friend-groups'] });
      
      // Force a hard refresh of the data
      Promise.all([
        refetchGroups(),
        refetchInvitations()
      ]).catch(error => {
        console.error('Error fetching initial data:', error);
      });
      
      // Mark invitations as initialized after the first load
      setTimeout(() => {
        setInvitationsInitialized(true);
      }, 500);
    }
  }, [user, refetchGroups, refetchInvitations, queryClient]);

  // Auto-select the first group when groups are loaded or when groups change
  useEffect(() => {
    if (friendGroups && friendGroups.length > 0) {
      // Only auto-select if no group is selected or after accepting an invitation
      if (!selectedGroupId || acceptedInvitation) {
        setSelectedGroupId(friendGroups[0].id);
        setSelectedGroupName(friendGroups[0].name);
        setAcceptedInvitation(false); // Reset the flag
      } else if (selectedGroupId) {
        // Check if the selected group still exists in the updated friendGroups
        const stillExists = friendGroups.some(group => group.id === selectedGroupId);
        if (!stillExists && friendGroups.length > 0) {
          setSelectedGroupId(friendGroups[0].id);
          setSelectedGroupName(friendGroups[0].name);
        }
      }
    } else if (friendGroups && friendGroups.length === 0) {
      // Reset selected group if there are no longer any groups
      setSelectedGroupId(null);
      setSelectedGroupName('');
    }
  }, [friendGroups, selectedGroupId, acceptedInvitation]);

  // Handle accepting a group invitation
  const handleAcceptInvitation = async (invitationId: string) => {
    if (processingInvitation) {
      return;
    }
    
    setProcessingInvitation(true);
    toast.info('Processing invitation...');
    
    try {
      // Accept the invitation
      acceptInvitation(invitationId);
      
      // Set flag to trigger group selection update
      setAcceptedInvitation(true);
      
      // Immediately refetch data to update UI
      setTimeout(async () => {
        // Clear all related caches first
        queryClient.removeQueries({ queryKey: ['group-invitations'] });
        queryClient.removeQueries({ queryKey: ['friend-groups'] });
        queryClient.invalidateQueries({ queryKey: ['friend-groups'] });
        queryClient.invalidateQueries({ queryKey: ['friend-group-members'] });
        queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
        
        // Then refetch everything with fresh data
        await Promise.all([
          refetchGroups(),
          refetchInvitations(),
          queryClient.invalidateQueries() // Invalidate all queries to be safe
        ]);
        
        setProcessingInvitation(false);
      }, 8000); // Increased timeout to ensure database operations complete
    } catch (error) {
      console.error('Error handling invitation accept:', error);
      toast.error('Failed to process invitation');
      setProcessingInvitation(false);
    }
  };

  // Handle manual refresh - more aggressive version
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    toast.info('Refreshing invitations and groups...');
    
    // Clear caches more aggressively
    queryClient.removeQueries();
    
    try {
      // Force a refresh of the friends list first
      await refreshFriends();
      
      // Then fetch invitations and groups
      await Promise.all([
        refetchInvitations(),
        refetchGroups()
      ]);
      
      // Reset any selected group if there's an issue
      if (friendGroups && friendGroups.length > 0) {
        const stillExists = friendGroups.some(group => group.id === selectedGroupId);
        if (!stillExists) {
          setSelectedGroupId(friendGroups[0].id);
        }
      } else {
        setSelectedGroupId(null);
      }
      
      toast.success('Refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle group selection
  const handleGroupSelection = (groupId: string, groupName: string) => {
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
  };

  return (
    <div className="min-h-screen pb-6">
      <NavBar />
      
      <div className="container max-w-6xl mx-auto pt-28 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Messages
            </h1>
            <p className="text-muted-foreground">
              Chat with your friend groups
            </p>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleManualRefresh}
            className="flex items-center gap-1"
            disabled={isRefreshing}
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>

        {/* Group Invitations - Only show if invitations have been initialized and there are invitations */}
        {invitationsInitialized && invitations && invitations.length > 0 && (
          <GroupInvitationsList 
            invitations={invitations}
            isLoading={isLoadingInvitations || processingInvitation}
            onAccept={handleAcceptInvitation}
            onDecline={declineInvitation}
          />
        )}

        {/* Group Dropdown Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">
            Message Group
          </label>
          {friendGroups && friendGroups.length > 0 ? (
            <GroupDropdownSelector
              selectedGroupId={selectedGroupId}
              groups={friendGroups}
              onSelectGroup={handleGroupSelection}
              className="w-full"
              label="Select Message Group"
            />
          ) : (isGroupsLoading || isLoadingFriends || isRefreshing) ? (
            <div className="flex items-center justify-center h-12 border rounded-md bg-muted/20">
              <p className="text-muted-foreground">Loading your groups...</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-12 border rounded-md bg-muted/20">
              <p className="text-muted-foreground">No groups available</p>
            </div>
          )}
        </div>

        {/* Messages Panel */}
        {selectedGroupId ? (
          <MessagesPanel 
            groupId={selectedGroupId} 
            groupName={selectedGroupName}
            isJoinedGroup={friendGroups?.find(g => g.id === selectedGroupId)?.isJoinedGroup}
            className="h-[700px]"
          />
        ) : (
          <Card className="border border-dashed bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-muted-foreground" />
                No Groups Found
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6">
              <div className="text-center mb-6">
                <p className="text-muted-foreground mb-2">
                  You don't have any friend groups yet. Create a friend group to start messaging.
                </p>
                <p className="text-sm text-muted-foreground/80">
                  Friend groups allow you to chat and compete with specific sets of friends.
                </p>
              </div>
              
              <Button 
                onClick={() => setConnectionsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <UsersRound className="h-4 w-4" />
                <span>Manage Friends & Groups</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Connections Modal for managing friends and groups */}
      {user && (
        <ConnectionsModal
          open={connectionsModalOpen}
          onOpenChange={setConnectionsModalOpen}
          currentPlayerId={user.id}
          onFriendRemoved={refreshFriends}
        />
      )}
    </div>
  );
};

export default Messages;
