import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { useQueryClient } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MessagesPanel from '@/components/messages/MessagesPanel';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { MessageCircle, Users, UserPlus, RotateCw, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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
    forceRefresh: forceRefreshInvitations
  } = useGroupInvitations();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [invitationsInitialized, setInvitationsInitialized] = useState(false);
  const [showDebug, setShowDebug] = useState(true); // Set to true by default to help diagnose the issue
  
  // Handle friends loading state
  useEffect(() => {
    if (friends) {
      setIsLoadingFriends(false);
    }
  }, [friends]);

  // Debugging: Log the friend groups and invitations data
  useEffect(() => {
    console.log('Friend groups in Messages page:', friendGroups);
    console.log('Group invitations:', invitations);
    console.log('Invitations count:', invitations?.length || 0);
    console.log('Is loading invitations:', isLoadingInvitations);
  }, [friendGroups, invitations, isLoadingInvitations]);

  // Ensure we fetch the latest groups and invitations when the component mounts
  useEffect(() => {
    if (user) {
      console.log('MESSAGES PAGE - Refreshing data on mount');
      refetchGroups();
      
      // Force refresh invitations immediately and more frequently
      forceRefreshInvitations();
      
      // Schedule more frequent refreshes of invitations
      const intervalId = setInterval(() => {
        console.log('MESSAGES PAGE - Running scheduled invitation refresh');
        forceRefreshInvitations(); // Use forceRefresh instead of regular refetch
      }, 2000); // Every 2 seconds instead of 5
      
      // After the first load, mark invitations as initialized
      setTimeout(() => {
        setInvitationsInitialized(true);
      }, 500); // Reduced from 1000ms
      
      return () => clearInterval(intervalId);
    }
  }, [user, refetchGroups, forceRefreshInvitations, refetchInvitations]);

  // Auto-select the first group when groups are loaded
  useEffect(() => {
    if (friendGroups && friendGroups.length > 0 && !selectedGroupId) {
      console.log('Auto-selecting first group:', friendGroups[0].id);
      setSelectedGroupId(friendGroups[0].id);
    }
  }, [friendGroups, selectedGroupId]);

  // Handle accepting a group invitation
  const handleAcceptInvitation = (invitationId: string) => {
    console.log('Accepting invitation with ID:', invitationId);
    toast.info('Processing invitation...');
    acceptInvitation(invitationId);
    
    // After accepting, wait a moment and refresh the groups list
    setTimeout(() => {
      refetchGroups();
      // Also refresh the invitations list to remove the accepted one
      forceRefreshInvitations();
    }, 1000);
  };

  const handleManualRefresh = () => {
    toast.info('Manually refreshing invitations and groups...');
    forceRefreshInvitations();
    refetchGroups();
    queryClient.removeQueries({ queryKey: ['group-invitations'] });
    queryClient.removeQueries({ queryKey: ['friend-groups'] });
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  return (
    <div className="min-h-screen pb-6">
      <NavBar />
      
      <div className="container max-w-6xl mx-auto pt-20 px-4">
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
          
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleManualRefresh}
              className="flex items-center gap-1"
            >
              <RotateCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={toggleDebug}
              className="flex items-center gap-1"
            >
              <Bug className="h-4 w-4" />
              <span>Debug</span>
            </Button>
          </div>
        </div>
        
        {showDebug && (
          <Card className="p-4 mb-6 bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>
                <strong>User ID:</strong> {user?.id || 'Not logged in'}
              </div>
              <div>
                <strong>Friends:</strong> {friends?.length || 0} loaded
              </div>
              <div>
                <strong>Friend Groups:</strong> {friendGroups?.length || 0} loaded
              </div>
              <div>
                <strong>Invitations State:</strong> {invitations?.length || 0} pending, loading: {isLoadingInvitations ? 'yes' : 'no'}, initialized: {invitationsInitialized ? 'yes' : 'no'}
              </div>
              {invitations && invitations.length > 0 && (
                <div>
                  <strong>First Invitation:</strong> {JSON.stringify(invitations[0], null, 2)}
                </div>
              )}
              <div>
                <strong>Direct Database Check:</strong>
                <pre>
                  {`SELECT * FROM friend_group_members 
WHERE friend_id = '${user?.id}' 
AND status = 'pending'`}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Group Invitations - Only show if invitations have been initialized */}
        {invitationsInitialized && (
          <GroupInvitationsList 
            invitations={invitations}
            isLoading={isLoadingInvitations}
            onAccept={handleAcceptInvitation}
            onDecline={declineInvitation}
            alwaysShow={true}
          />
        )}

        {/* Friend groups for messaging */}
        {(isGroupsLoading || isLoadingFriends) ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your groups...</p>
          </div>
        ) : friendGroups && friendGroups.length > 0 ? (
          <Tabs defaultValue={selectedGroupId || "default"} onValueChange={setSelectedGroupId} className="w-full">
            <TabsList className="mb-6 flex-wrap">
              {friendGroups.map(group => (
                <TabsTrigger key={group.id} value={group.id} className="flex items-center gap-2">
                  {group.isJoinedGroup ? <UserPlus className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  {group.name}
                  {group.isJoinedGroup && (
                    <Badge variant="outline" className="ml-1 bg-secondary/30">
                      Joined
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {friendGroups.map(group => (
              <TabsContent key={group.id} value={group.id} className="mt-0">
                <MessagesPanel 
                  groupId={group.id} 
                  groupName={group.name}
                  isJoinedGroup={group.isJoinedGroup}
                  className="h-[600px]"
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Groups Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You don't have any friend groups yet. Create a friend group to start messaging.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Messages;
