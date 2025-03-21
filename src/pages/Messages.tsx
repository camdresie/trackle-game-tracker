
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MessagesPanel from '@/components/messages/MessagesPanel';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { MessageCircle, Users, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Messages = () => {
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
    refetch: refetchInvitations
  } = useGroupInvitations();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  // Handle friends loading state
  useEffect(() => {
    if (friends) {
      setIsLoadingFriends(false);
    }
  }, [friends]);

  // Debugging: Log the friend groups data
  useEffect(() => {
    console.log('Friend groups in Messages page:', friendGroups);
    console.log('Group invitations:', invitations);
    console.log('Is loading:', isGroupsLoading || isLoadingFriends);
  }, [friendGroups, invitations, isGroupsLoading, isLoadingFriends]);

  // Ensure we fetch the latest groups and invitations when the component mounts
  useEffect(() => {
    if (user) {
      console.log('Refreshing groups and invitations in Messages page');
      refetchGroups();
      refetchInvitations();
    }
  }, [user, refetchGroups, refetchInvitations]);

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
    acceptInvitation(invitationId);
    // After accepting, wait a moment and refresh the groups list
    setTimeout(() => {
      refetchGroups();
      // Also refresh the invitations list to remove the accepted one
      refetchInvitations();
    }, 1000);
  };

  return (
    <div className="min-h-screen pb-6">
      <NavBar />
      
      <div className="container max-w-6xl mx-auto pt-20 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Messages
          </h1>
          <p className="text-muted-foreground">
            Chat with your friend groups
          </p>
        </div>

        {/* Group Invitations - Show at the top if there are any */}
        {/* Force the invitations UI to show for debugging */}
        <GroupInvitationsList 
          invitations={invitations}
          isLoading={isLoadingInvitations}
          onAccept={handleAcceptInvitation}
          onDecline={declineInvitation}
        />

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
