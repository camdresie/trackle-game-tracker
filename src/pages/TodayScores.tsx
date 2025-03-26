import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { useHomeData } from '@/hooks/useHomeData';
import { useGroupScores } from '@/hooks/useGroupScores';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { useFriendsList } from '@/hooks/useFriendsList';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GamepadIcon, Users, Trophy, ChevronRight, CalendarDays, MessageCircle, InfoIcon, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { games } from '@/utils/gameData';
import GroupMessagesModal from '@/components/messages/GroupMessagesModal';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { getFormattedTodayInEasternTime } from '@/utils/dateUtils';
import GroupScoresShare from '@/components/groups/GroupScoresShare';
import GameDropdownSelector from '@/components/game/GameDropdownSelector';
import { useIsMobile } from '@/hooks/use-mobile';

// Define a consistent interface for group members
interface GroupMember {
  playerId: string;
  playerName: string;
  hasPlayed: boolean;
  score?: number | null;
  isCurrentUser?: boolean;
}

const TodayScores = () => {
  const { user, profile } = useAuth();
  const {
    isLoading: isHomeDataLoading,
    gamesList,
    todaysGames,
    selectedGame,
    setSelectedGame,
  } = useHomeData();
  
  // Get friends list using the appropriate hook
  const { friends } = useFriendsList();
  
  // Changed default active tab to 'friends' instead of 'groups'
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');
  const [showMessages, setShowMessages] = useState(false);
  const [selectedGroupForMessages, setSelectedGroupForMessages] = useState<{id: string, name: string} | null>(null);
  const isMobile = useIsMobile();
  
  
  // Get group invitations
  const { 
    invitations, 
    isLoading: isLoadingInvitations,
    acceptInvitation,
    declineInvitation 
  } = useGroupInvitations();
  
  // Set default game to Wordle on component mount
  useEffect(() => {
    if (!selectedGame && gamesList.length > 0) {
      const wordleGame = gamesList.find(g => g.id === 'wordle') || gamesList[0];
      setSelectedGame(wordleGame);
    }
  }, [gamesList, selectedGame, setSelectedGame]);
  
  // Fetch group performance data for selected game
  const { isLoading, groupPerformanceData } = useGroupScores(
    selectedGame?.id || null,
    todaysGames
  );
  
  // Handler for game selection 
  const handleGameSelect = (gameId: string) => {
    const game = gamesList.find(g => g.id === gameId) || null;
    setSelectedGame(game);
  };

  // Handle opening messages for a specific group
  const handleOpenMessages = (groupId: string, groupName: string) => {
    setSelectedGroupForMessages({ id: groupId, name: groupName });
    setShowMessages(true);
  };
  
  
  // Get today's date in Eastern Time for consistency
  const today = getFormattedTodayInEasternTime();
  
  // Determine if lower scores are better for the selected game
  const isLowerBetter = selectedGame?.id === 'wordle' || selectedGame?.id === 'mini-crossword';
  
  // Add debugging
  useEffect(() => {
    if (groupPerformanceData) {
      console.log("TodayScores: Raw group performance data:", JSON.stringify(groupPerformanceData, null, 2));
    }
  }, [groupPerformanceData]);
  
  // Helper function to determine the leading player in a group
  const getLeadingPlayerInGroup = (group: any) => {
    if (!group || !group.members || group.members.length === 0) return null;
    
    // Filter to only players who have played
    const playersWithScores = [
      // Include current user if they've played
      ...(group.currentUserHasPlayed ? [{
        playerId: 'currentUser', 
        playerName: 'You',
        score: group.currentUserScore,
        isCurrentUser: true
      }] : []),
      // Include all members who have played
      ...group.members.filter((m: any) => m.hasPlayed && m.score !== null)
    ];
    
    if (playersWithScores.length === 0) return null;
    
    // Sort based on game type (lower or higher is better)
    const sorted = [...playersWithScores].sort((a, b) => {
      if (isLowerBetter) {
        return (a.score || 999) - (b.score || 999);
      } else {
        return (b.score || 0) - (a.score || 0);
      }
    });
    
    // Return the leading player
    return sorted[0];
  };
  
  // Convert member data to GroupMemberScore format
  const convertToGroupMemberScores = (members: any[]) => {
    return members.map(member => ({
      playerName: member.playerName,
      score: member.score,
      hasPlayed: member.hasPlayed
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-28 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Today's Scores</h1>
            <p className="text-muted-foreground">{today}</p>
          </div>
        </div>
        
        
        
        {/* Time zone message */}
        <div className="mb-6 bg-muted/60 rounded-lg p-3 flex items-center gap-2 text-sm">
          <InfoIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-muted-foreground">
            Today's scores reset at midnight Eastern Time (ET).
          </p>
        </div>
        
        {/* Group Invitations - Show only if there are any */}
        {invitations && invitations.length > 0 && (
          <GroupInvitationsList 
            invitations={invitations}
            isLoading={isLoadingInvitations}
            onAccept={acceptInvitation}
            onDecline={declineInvitation}
          />
        )}
        
        {/* Game Dropdown for both mobile and desktop */}
        <GameDropdownSelector
          selectedGame={selectedGame?.id || ''}
          games={games}
          onSelectGame={handleGameSelect}
          className="mb-4"
          showOnDesktop={true}
        />
        
        
        
        {!selectedGame ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <GamepadIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a Game</h2>
            <p className="text-muted-foreground">
              Choose a game from the options above to see how you compare with your friends.
            </p>
          </Card>
        ) : isLoading || isHomeDataLoading ? (
          <div className="space-y-4">
            <div className="h-20 bg-muted/30 animate-pulse rounded-lg"></div>
            <div className="h-40 bg-muted/30 animate-pulse rounded-lg"></div>
            <div className="h-40 bg-muted/30 animate-pulse rounded-lg"></div>
          </div>
        ) : groupPerformanceData.length === 0 ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Groups Found</h2>
            <p className="text-muted-foreground">
              You haven't created any friend groups yet. Create a group to compare your scores.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'friends' | 'groups')}
              className="w-full"
            >
              <TabsList className="mb-4">
                {/* Swapped tab order - All Friends first, By Group second */}
                <TabsTrigger value="friends" className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>All Friends</span>
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>By Group</span>
                </TabsTrigger>
              </TabsList>
              
              {/* All Friends tab content - moved to be first */}
              <TabsContent value="friends" className="space-y-6">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-xl flex items-center gap-2 truncate max-w-[60%]">
                      <CalendarDays className="w-5 h-5 text-accent flex-shrink-0" />
                      <span className="truncate">All Friends' Scores Today</span>
                    </h3>
                    
                    
                    {friends.length > 0 && (
                      <GroupScoresShare
                        groupName="All Friends"
                        gameName={selectedGame?.name || ""}
                        gameColor={selectedGame?.color || ""}
                        members={friends.map(friend => {
                          // Find this friend's data in any group
                          const friendData = groupPerformanceData.flatMap(group => group.members)
                            .find(member => member.playerId === friend.id);
                            
                          return {
                            playerName: friend.name,
                            score: friendData?.score || null,
                            hasPlayed: friendData?.hasPlayed || false
                          };
                        })}
                        currentUserName={profile?.username || ""}
                        currentUserScore={groupPerformanceData.find(g => g.currentUserHasPlayed)?.currentUserScore}
                        currentUserHasPlayed={groupPerformanceData.some(g => g.currentUserHasPlayed)}
                        useActualUsername={true}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center justify-center gap-1"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </Button>
                      </GroupScoresShare>
                    )}
                  </div>
                  
                  {/* Friends scores list */}
                  <div className="space-y-3">
                    {/* Include current user in the friends list for ranking */}
                    {[
                      // Add current user to the list if they've played and not already in friend list
                      ...(groupPerformanceData.some(g => g.currentUserHasPlayed) && 
                         !friends.some(f => user && f.id === user.id) ? [{
                        playerId: user?.id || '',
                        playerName: 'You',
                        hasPlayed: true,
                        score: groupPerformanceData.find(g => g.currentUserHasPlayed)?.currentUserScore || null,
                        isCurrentUser: true
                      }] : []),
                      
                      // Add friends to the list with explicitly set isCurrentUser property
                      // Special handling for current user if they appear in friends list
                      ...friends.map(friend => {
                        // Is this friend entry the current user?
                        const isCurrentUser = user && friend.id === user.id;
                        
                        // Find this friend's data in any group
                        const friendData = groupPerformanceData.flatMap(group => group.members)
                          .find(member => member.playerId === friend.id);
                        
                        // If this is the current user and they've already played, don't add again
                        if (isCurrentUser && groupPerformanceData.some(g => g.currentUserHasPlayed)) {
                          return null; // Skip this entry
                        }
                          
                        return {
                          playerId: friend.id,
                          playerName: isCurrentUser ? 'You' : friend.name,
                          hasPlayed: friendData?.hasPlayed || false,
                          score: friendData?.score || null,
                          isCurrentUser
                        };
                      }).filter(Boolean) // Filter out null entries
                    ]
                      // Sort by score (lower is better for some games)
                      .sort((a, b) => {
                        // Handle players with no scores
                        if (!a.hasPlayed && !b.hasPlayed) return 0;
                        if (!a.hasPlayed) return 1;
                        if (!b.hasPlayed) return -1;
                        
                        // Sort by score
                        return isLowerBetter 
                          ? (a.score || 999) - (b.score || 999)
                          : (b.score || 0) - (a.score || 0);
                      })
                      .map((person, index) => (
                        <div 
                          key={person.playerId}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            person.isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50"
                          } ${index === 0 && person.hasPlayed ? "border border-accent/20" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                            {index === 0 && person.hasPlayed && (
                              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                            <div className="font-medium truncate">
                              {person.playerName}
                            </div>
                            {index === 0 && person.hasPlayed && (
                              <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                Top score
                              </span>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {person.hasPlayed ? (
                              <span className="font-semibold">{person.score}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No score yet</span>
                            )}
                          </div>
                        </div>
                      ))
                    }
                    
                  </div>
                </Card>
              </TabsContent>
              
              {/* By Group tab content - moved to be second */}
              <TabsContent value="groups" className="space-y-6">
                <div className="space-y-6">
                  
                  {groupPerformanceData.map((group) => {
                    const leadingPlayer = getLeadingPlayerInGroup(group);
                    // Convert members array to the format expected by GroupScoresShare
                    const groupMemberScores = convertToGroupMemberScores(group.members);
                  
                    // FIXED: Create a combined list of all members properly handling current user
                    const allMembers: GroupMember[] = [];
                  
                    // If the current user has played, add them to the list first
                    if (group.currentUserHasPlayed) {
                      console.log(`Group ${group.groupName}: Adding current user with score ${group.currentUserScore}`);
                      allMembers.push({
                        playerId: user?.id || '',
                        playerName: 'You',
                        hasPlayed: true,
                        score: group.currentUserScore,
                        isCurrentUser: true
                      });
                    } else if (user) {
                      // If current user hasn't played, add them as not played
                      console.log(`Group ${group.groupName}: Adding current user as not played`);
                      allMembers.push({
                        playerId: user.id,
                        playerName: 'You',
                        hasPlayed: false,
                        isCurrentUser: true
                      });
                    }
                  
                    // Add all other group members (excluding the current user)
                    group.members.forEach(m => {
                      // Skip if this is the current user - we've already handled them above
                      if (user && m.playerId === user.id) {
                        console.log(`Group ${group.groupName}: Skipping current user ${m.playerName} from members list`);
                        return;
                      }
                    
                      // Add non-current-user member
                      console.log(`Group ${group.groupName}: Adding member ${m.playerName}`);
                      allMembers.push({
                        ...m,
                        isCurrentUser: false
                      });
                    });
                  
                    console.log(`Group ${group.groupName}: Final allMembers:`, allMembers);
                  
                    // Sort all members by score, with played members at the top
                    const sortedMembers = [...allMembers]
                      .filter(m => m.hasPlayed)
                      .sort((a, b) => {
                        if (isLowerBetter) {
                          return (a.score || 999) - (b.score || 999);
                        } else {
                          return (b.score || 0) - (a.score || 0);
                        }
                      });
                  
                    // Get members who haven't played
                    const notPlayedMembers = allMembers.filter(m => !m.hasPlayed);
                  
                    console.log(`Group ${group.groupName}: Sorted members:`, sortedMembers);
                    console.log(`Group ${group.groupName}: Not played members:`, notPlayedMembers);
                  
                    return (
                      
                      <Card key={group.groupId} className="p-6 overflow-hidden">
                        
                        <div className="flex flex-col">
                          {/* Group header with title */}
                          <>
                              <div className="mb-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-xl flex items-center gap-2">
                                    <Users className="w-5 h-5 text-accent flex-shrink-0" />
                                    <span className="truncate">{group.groupName}</span>
                                  </h3>
                                  {/* Only show Leading badge here on mobile, not in the score section below */}
                                  {leadingPlayer?.isCurrentUser && (
                                    <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
                                      <Trophy className="w-3 h-3 mr-1" /> Leading
                                    </span>
                                  )}
                                </div>
                                
                                {/* Updated button styling to match the app's style */}
                                <div className="flex items-center gap-2 mt-3">
                                  <GroupScoresShare
                                    groupName={group.groupName}
                                    gameName={selectedGame?.name || ""}
                                    gameColor={selectedGame?.color || ""}
                                    members={groupMemberScores}
                                    currentUserName={profile?.username || ""}
                                    currentUserScore={group.currentUserScore}
                                    currentUserHasPlayed={group.currentUserHasPlayed}
                                    useActualUsername={true}
                                  >
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex items-center justify-center gap-1"
                                    >
                                      <Share2 className="w-4 h-4" />
                                      <span>Share</span>
                                    </Button>
                                  </GroupScoresShare>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleOpenMessages(group.groupId, group.groupName)}
                                    className="flex items-center justify-center gap-1"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Messages</span>
                                  </Button>
                                </div>
                              </div>
                            </>
                          
                          {/* Group members scores */}
                          <div className="space-y-3">
                            {sortedMembers.length > 0 ? (
                              sortedMembers.map((member, index) => (
                                <div 
                                  key={`${member.playerId}-${index}`} 
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-lg transition-colors",
                                    member.isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50",
                                    index === 0 ? "border border-accent/20" : ""
                                  )}
                                >
                                  <div className="flex items-center gap-2 font-medium min-w-0 max-w-[70%]">
                                    <span className="truncate">
                                      {member.playerName}
                                    </span>
                                    {index === 0 && (
                                      <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
                                        <Trophy className="w-3 h-3 mr-1" /> Leading
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center flex-shrink-0">
                                    <span className="font-semibold">{member.score}</span>
                                    <ChevronRight className="ml-2 w-4 h-4 text-muted-foreground" />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                No scores recorded for this group today
                              </div>
                            )}
                          
                            {notPlayedMembers.map((member, index) => (
                              <div 
                                key={`${member.playerId}-notplayed-${index}`} 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg transition-colors text-muted-foreground",
                                  member.isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50"
                                )}
                              >
                                <div className="flex items-center gap-2 font-medium min-w-0 max-w-[70%]">
                                  <span className="truncate">{member.playerName}</span>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                  <span className="text-sm text-muted-foreground">No score yet</span>
                                  <ChevronRight className="ml-2 w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      
      {/* Messages Modal */}
      {selectedGroupForMessages && (
        <GroupMessagesModal
          open={showMessages}
          onOpenChange={setShowMessages}
          groupId={selectedGroupForMessages.id}
          groupName={selectedGroupForMessages.name}
        />
      )}
    </div>
  );
};

export default TodayScores;
