
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { useFriendsList } from '@/hooks/useFriendsList';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MessagesPanel from '@/components/messages/MessagesPanel';
import { MessageCircle, Users } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const { friends, isLoading: isFriendsLoading } = useFriendsList();
  const { friendGroups, isLoading: isGroupsLoading, refetchGroups } = useFriendGroups(friends);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Debugging: Log the friend groups data
  useEffect(() => {
    console.log('Friend groups in Messages page:', friendGroups);
    console.log('Is loading:', isGroupsLoading || isFriendsLoading);
  }, [friendGroups, isGroupsLoading, isFriendsLoading]);

  // Ensure we fetch the latest groups when the component mounts or when friends list changes
  useEffect(() => {
    if (user && friends && friends.length > 0) {
      refetchGroups();
    }
  }, [user, friends, refetchGroups]);

  // Auto-select the first group when groups are loaded
  useEffect(() => {
    if (friendGroups && friendGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(friendGroups[0].id);
    }
  }, [friendGroups, selectedGroupId]);

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

        {(isGroupsLoading || isFriendsLoading) ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your groups...</p>
          </div>
        ) : friendGroups && friendGroups.length > 0 ? (
          <Tabs defaultValue={selectedGroupId || "default"} onValueChange={setSelectedGroupId} className="w-full">
            <TabsList className="mb-6">
              {friendGroups.map(group => (
                <TabsTrigger key={group.id} value={group.id} className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {friendGroups.map(group => (
              <TabsContent key={group.id} value={group.id} className="mt-0">
                <MessagesPanel 
                  groupId={group.id} 
                  groupName={group.name} 
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
