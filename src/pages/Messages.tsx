import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { MessageCircle, RotateCw, UsersRound, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import GroupDropdownSelector from '@/components/messages/GroupDropdownSelector';
import { useLocation, useSearchParams } from 'react-router-dom';

// Track render count to identify potential infinite loops
let renderCount = 0;

const Messages = () => {
  // Increment render count for debugging
  const thisRenderCount = ++renderCount;
  const componentId = useRef(`messages-page-${Math.random().toString(36).substr(2, 9)}`).current;
  
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { friends, refreshFriends } = useFriendsList();
  
  // All relevant state in one place
  const [appState, setAppState] = useState({
    selectedGroupId: searchParams.get('groupId'),
    selectedGroupName: searchParams.get('groupName') || '',
    isLoadingFriends: true,
    invitationsInitialized: false,
    acceptedInvitation: false,
    processingInvitation: false,
    connectionsModalOpen: false,
    isRefreshing: false
  });
  
  // Simplify state updates with a single function
  const updateAppState = useCallback((updates: Partial<typeof appState>) => {
    setAppState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  // Get groups from custom hook
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
  
  // Handle friends loading state - use a ref to prevent unnecessary re-renders
  const friendsProcessedRef = useRef(false);
  
  useEffect(() => {
    if (friends && !friendsProcessedRef.current) {
      updateAppState({ isLoadingFriends: false });
      friendsProcessedRef.current = true;
    }
  }, [friends, updateAppState]);

  // Simplify group selection changes using a callback that won't change
  const handleGroupSelection = useCallback((groupId: string, groupName: string) => {
    updateAppState({ 
      selectedGroupId: groupId,
      selectedGroupName: groupName
    });
  }, [updateAppState]);

  // Initial data load - only run ONCE when the component mounts
  useEffect(() => {
    if (!user) return;
    
    // Clear cache and fetch initial data
    const initializeData = async () => {
      try {
        // Clear caches before fetching
        queryClient.removeQueries({ queryKey: ['group-invitations'] });
        queryClient.removeQueries({ queryKey: ['friend-groups'] });
        
        // Fetch data
        const results = await Promise.all([
          refetchGroups(),
          refetchInvitations()
        ]);
        
        // Mark invitations as initialized after a short delay
        setTimeout(() => {
          updateAppState({ invitationsInitialized: true });
        }, 500);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    initializeData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only re-run if user ID changes

  // Set initial group only once when groups become available
  const groupsProcessedRef = useRef(false);
  
  useEffect(() => {
    // Skip if we've already processed groups or if there are no groups
    if (groupsProcessedRef.current || !friendGroups || friendGroups.length === 0) return;
    
    // Use URL group if specified, otherwise use first group
    const initialGroupId = appState.selectedGroupId || friendGroups[0].id;
    const initialGroup = friendGroups.find(g => g.id === initialGroupId) || friendGroups[0];
    
    if (initialGroup) {
      updateAppState({
        selectedGroupId: initialGroup.id,
        selectedGroupName: initialGroup.name,
        acceptedInvitation: false
      });
      
      groupsProcessedRef.current = true;
    }
  }, [friendGroups, appState.selectedGroupId, updateAppState]);

  // Handle accepting a group invitation
  const handleAcceptInvitation = async (invitationId: string) => {
    if (appState.processingInvitation) return;
    
    updateAppState({ processingInvitation: true });
    toast.info('Processing invitation...');
    
    try {
      // Accept the invitation
      acceptInvitation(invitationId);
      
      // Set flag to trigger group selection update
      updateAppState({ acceptedInvitation: true });
      
      // Immediately refetch data to update UI
      setTimeout(async () => {
        try {
          // Clear caches and refetch
          queryClient.removeQueries({ queryKey: ['group-invitations'] });
          queryClient.removeQueries({ queryKey: ['friend-groups'] });
          queryClient.invalidateQueries({ 
            queryKey: ['social-data'],
            refetchType: 'all'
          });
          
          await Promise.all([
            refetchGroups(),
            refetchInvitations()
          ]);
          
          // Reset group selection to first available group
          groupsProcessedRef.current = false;
          
          updateAppState({ processingInvitation: false });
        } catch (error) {
          console.error('Error refreshing after invitation:', error);
          updateAppState({ processingInvitation: false });
        }
      }, 8000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to process invitation');
      updateAppState({ processingInvitation: false });
    }
  };

  // Handle manual refresh
  const handleManualRefresh = async () => {
    updateAppState({ isRefreshing: true });
    toast.info('Refreshing invitations and groups...');
    
    try {
      // Clear caches
      queryClient.removeQueries({ queryKey: ['social-data'] });
      
      // Refresh data
      await refreshFriends();
      
      await Promise.all([
        refetchInvitations(),
        refetchGroups()
      ]);
      
      // Reset group processing flag to ensure we select a valid group
      groupsProcessedRef.current = false;
      
      toast.success('Refreshed successfully');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh data');
    } finally {
      updateAppState({ isRefreshing: false });
    }
  };

  // Memoize the MessagesPanel component to prevent unnecessary rerenders
  const messagesPanelComponent = useMemo(() => {
    if (!appState.selectedGroupId) return null;
    
    const isJoinedGroup = !!friendGroups?.find(g => g.id === appState.selectedGroupId)?.isJoinedGroup;
    
    return (
      <MessagesPanel
        key={`msg-panel-${appState.selectedGroupId}`} // Key based on group ID to remount on group change
        groupId={appState.selectedGroupId}
        groupName={appState.selectedGroupName}
        isJoinedGroup={isJoinedGroup}
        className="h-[calc(100vh-280px)] min-h-[400px]"
      />
    );
  }, [appState.selectedGroupId, appState.selectedGroupName, friendGroups]);

  // Memoize the empty state panel
  const emptyStatePanel = useMemo(() => (
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
          onClick={() => updateAppState({ connectionsModalOpen: true })}
          className="flex items-center gap-2"
        >
          <UsersRound className="h-4 w-4" />
          <span>Manage Friends & Groups</span>
        </Button>
      </CardContent>
    </Card>
  ), [updateAppState]);

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
          
          <div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleManualRefresh}
              className="flex items-center gap-1"
              disabled={appState.isRefreshing}
            >
              <RotateCw className={`h-4 w-4 ${appState.isRefreshing ? 'animate-spin' : ''}`} />
              <span>{appState.isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
          </div>
        </div>

        {/* Group Invitations */}
        {appState.invitationsInitialized && invitations && invitations.length > 0 && (
          <GroupInvitationsList 
            invitations={invitations}
            isLoading={isLoadingInvitations || appState.processingInvitation}
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
              selectedGroupId={appState.selectedGroupId}
              groups={friendGroups}
              onSelectGroup={handleGroupSelection}
              className="w-full"
              label="Select Message Group"
            />
          ) : (isGroupsLoading || appState.isLoadingFriends || appState.isRefreshing) ? (
            <div className="flex items-center justify-center h-12 border rounded-md bg-muted/20">
              <p className="text-muted-foreground">Loading your groups...</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-12 border rounded-md bg-muted/20">
              <p className="text-muted-foreground">No groups available</p>
            </div>
          )}
        </div>

        {/* MessagesPanel or Empty State */}
        {appState.selectedGroupId ? messagesPanelComponent : emptyStatePanel}
      </div>
      
      {/* Connections Modal for managing friends and groups */}
      {user && (
        <ConnectionsModal
          open={appState.connectionsModalOpen}
          onOpenChange={(open) => updateAppState({ connectionsModalOpen: open })}
          currentPlayerId={user.id}
          onFriendRemoved={refreshFriends}
        />
      )}
    </div>
  );
};

export default Messages;
