
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { useFriendsList } from '@/hooks/useFriendsList';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MessagesPanel from '@/components/messages/MessagesPanel';
import { MessageCircle, Users, UserPlus, Mail, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { toast } from 'sonner';

const Messages = () => {
  const { user } = useAuth();
  const { friends, refreshFriends } = useFriendsList();
  const { 
    friendGroups, 
    pendingInvitations,
    isLoading: isGroupsLoading, 
    refetchGroups,
    respondToInvitation
  } = useFriendGroups(friends);
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
    console.log('Pending invitations:', pendingInvitations);
    console.log('Is loading:', isGroupsLoading || isLoadingFriends);
  }, [friendGroups, pendingInvitations, isGroupsLoading, isLoadingFriends]);

  // Ensure we fetch the latest groups when the component mounts or when friends list changes
  useEffect(() => {
    if (user) {
      console.log('Refreshing groups in Messages page');
      refetchGroups();
    }
  }, [user, refetchGroups]);

  // Auto-select the first group when groups are loaded
  useEffect(() => {
    if (friendGroups && friendGroups.length > 0 && !selectedGroupId) {
      const visibleGroups = friendGroups.filter(group => 
        !group.isJoinedGroup || (group.isJoinedGroup && group.status === 'accepted')
      );
      
      if (visibleGroups.length > 0) {
        console.log('Auto-selecting first group:', visibleGroups[0].id);
        setSelectedGroupId(visibleGroups[0].id);
      }
    }
  }, [friendGroups, selectedGroupId]);

  // Handle invitation response
  const handleAcceptInvitation = (invitationId: string) => {
    console.log('Accepting group invitation:', invitationId);
    respondToInvitation({ invitationId, status: 'accepted' });
    toast.success('Group invitation accepted');
  };

  const handleDeclineInvitation = (invitationId: string) => {
    console.log('Declining group invitation:', invitationId);
    respondToInvitation({ invitationId, status: 'rejected' });
    toast.success('Group invitation declined');
  };

  // Filter groups to only show ones the user owns or has accepted invitations to
  const visibleGroups = friendGroups.filter(group => 
    !group.isJoinedGroup || (group.isJoinedGroup && group.status === 'accepted')
  );

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

        {/* Group Invitations Alert */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <div className="mb-6 animate-pulse">
            <Card className="border-2 border-amber-400 bg-amber-50/20 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Group Invitations
                  <Badge variant="destructive" className="ml-2">{pendingInvitations.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You have {pendingInvitations.length} pending group {pendingInvitations.length === 1 ? 'invitation' : 'invitations'}.
                  Please review and respond to them below.
                </p>
                
                <GroupInvitationsList
                  invitations={pendingInvitations}
                  isLoading={isGroupsLoading}
                  onAccept={handleAcceptInvitation}
                  onDecline={handleDeclineInvitation}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {(isGroupsLoading || isLoadingFriends) ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your groups...</p>
          </div>
        ) : visibleGroups && visibleGroups.length > 0 ? (
          <Tabs defaultValue={selectedGroupId || "default"} onValueChange={setSelectedGroupId} className="w-full">
            <TabsList className="mb-6 flex-wrap">
              {visibleGroups.map(group => (
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
            
            {visibleGroups.map(group => (
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
