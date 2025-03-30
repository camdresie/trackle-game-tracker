import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { useHomeData } from '@/hooks/useHomeData';
import { useGroupScores } from '@/hooks/useGroupScores';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { useFriendsList } from '@/hooks/useFriendsList';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  GamepadIcon, 
  Users, 
  Trophy, 
  ChevronRight, 
  CalendarDays, 
  MessageCircle, 
  InfoIcon, 
  Share2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { games } from '@/utils/gameData';
import GroupMessagesModal from '@/components/messages/GroupMessagesModal';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { getFormattedTodayInEasternTime } from '@/utils/dateUtils';
import GroupScoresShare from '@/components/groups/GroupScoresShare';
import GameDropdownSelector from '@/components/game/GameDropdownSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import ConnectionsModal from '@/components/ConnectionsModal';
import { toast } from 'sonner';

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
  const { isLoading, groupPerformanceData, allFriendsData, refreshFriends } = useGroupScores(
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
  const isLowerBetter = selectedGame?.id === 'wordle' || 
                       selectedGame?.id === 'mini-crossword' || 
                       selectedGame?.id === 'connections' ||
                       selectedGame?.id === 'framed' ||
                       selectedGame?.id === 'nerdle';
  
  // Add debugging
  useEffect(() => {
    if (groupPerformanceData) {
      console.log("TodayScores: Raw group performance data:", JSON.stringify(groupPerformanceData, null, 2));
    }
    if (allFriendsData) {
      console.log("TodayScores: All friends data:", JSON.stringify(allFriendsData, null, 2));
    }
  }, [groupPerformanceData, allFriendsData]);
  
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

  // Create a combined list for all friends including those without scores
  // Use the new allFriendsData that comes directly from the hook
  const getAllFriendsList = useMemo(() => {
    // Start with an empty list
    const allFriends: GroupMember[] = [];
    
    // Add current user first if they exist and we have allFriendsData
    if (user && allFriendsData) {
      allFriends.push({
        playerId: user.id,
        playerName: 'You',
        hasPlayed: allFriendsData.currentUserHasPlayed,
        score: allFriendsData.currentUserScore,
        isCurrentUser: true
      });
      
      // Add all friends from the allFriendsData
      allFriendsData.members.forEach(member => {
        allFriends.push({
          playerId: member.playerId,
          playerName: member.playerName,
          hasPlayed: member.hasPlayed,
          score: member.score,
          isCurrentUser: false
        });
      });
    } 
    // Fallback to the old method if we don't have allFriendsData
    else if (user) {
      // First add the current user
      const hasPlayed = groupPerformanceData.some(g => g.currentUserHasPlayed);
      const userScore = hasPlayed ? 
        groupPerformanceData.find(g => g.currentUserHasPlayed)?.currentUserScore : null;
        
      allFriends.push({
        playerId: user.id,
        playerName: 'You',
        hasPlayed: hasPlayed,
        score: userScore,
        isCurrentUser: true
      });
      
      // Then add all the user's friends
      friends.forEach(friend => {
        // Skip if this is the current user (already added)
        if (friend.id === user.id) return;
        
        // Find this friend's data in any group
        const friendData = groupPerformanceData.flatMap(group => group.members)
          .find(member => member?.playerId === friend.id);
          
        allFriends.push({
          playerId: friend.id,
          playerName: friend.name,
          hasPlayed: friendData?.hasPlayed || false,
          score: friendData?.score || null,
          isCurrentUser: false
        });
      });
    }
    
    return allFriends;
  }, [user, allFriendsData, groupPerformanceData, friends]);

  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const [activeConnectionsTab, setActiveConnectionsTab] = useState<string>('friends');
  
  // Handle opening connections modal with specific tab selected
  const handleOpenConnectionsModal = (tab: string = 'friends') => {
    setActiveConnectionsTab(tab);
    setConnectionsModalOpen(true);
  };
  
  // Function to handle manual refresh
  const handleManualRefresh = async () => {
    console.log("Manual refresh triggered");
    try {
      if (refreshFriends) {
        await refreshFriends();
        toast.success("Friend data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing friend data:", error);
      toast.error("Failed to refresh friend data");
    }
  };
  
  // Use the allFriendsData for the GroupScoresShare component in the All Friends tab
  const getAllFriendsForScoreShare = () => {
    if (allFriendsData) {
      return {
        groupName: "All Friends",
        members: allFriendsData.members.map(m => ({
          playerName: m.playerName,
          score: m.score,
          hasPlayed: m.hasPlayed
        })),
        currentUserName: profile?.full_name || profile?.username || 'You',
        currentUserScore: allFriendsData.currentUserScore,
        currentUserHasPlayed: allFriendsData.currentUserHasPlayed,
        allFriends: true
      };
    } else {
      // Create from the memoized list
      return {
        groupName: "All Friends",
        members: getAllFriendsList
          .filter(f => !f.isCurrentUser)
          .map(m => ({
            playerName: m.playerName,
            score: m.score,
            hasPlayed: m.hasPlayed
          })),
        currentUserName: profile?.full_name || profile?.username || 'You',
        currentUserScore: getAllFriendsList.find(m => m.isCurrentUser)?.score || null,
        currentUserHasPlayed: getAllFriendsList.find(m => m.isCurrentUser)?.hasPlayed || false,
        allFriends: true
      };
    }
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
                    <h3 className="font-semibold text-base sm:text-lg md:text-xl flex items-center gap-2 truncate max-w-[70%]">
                      <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                      <span className="truncate">{selectedGame?.name || ''} Scores Today</span>
                    </h3>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleManualRefresh}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className={cn(isMobile ? "sr-only" : "")}>Refresh</span>
                      </Button>
                      
                      {friends.length > 0 && (
                        <GroupScoresShare
                          groupName="All Friends"
                          gameName={selectedGame?.name || ""}
                          gameColor={selectedGame?.color || ""}
                          members={getAllFriendsForScoreShare().members}
                          currentUserName={profile?.username || ""}
                          currentUserScore={getAllFriendsForScoreShare().currentUserScore}
                          currentUserHasPlayed={getAllFriendsForScoreShare().currentUserHasPlayed}
                          useActualUsername={true}
                        >
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center justify-center gap-1"
                          >
                            <Share2 className="w-4 h-4" />
                            <span className={cn(isMobile ? "sr-only" : "")}>Share</span>
                          </Button>
                        </GroupScoresShare>
                      )}
                    </div>
                  </div>
                  
                  {/* Friends scores list - Modified to always show current user */}
                  <div className="space-y-3">
                    {getAllFriendsList.length > 0 ? (
                      /* Get all friends + current user and sort by those who have played first, then by score */
                      getAllFriendsList
                        // Sort played first, then by score (lower is better for some games)
                        .sort((a, b) => {
                          // First sort by played status - people who played come first
                          if (a.hasPlayed && !b.hasPlayed) return -1;
                          if (!a.hasPlayed && b.hasPlayed) return 1;
                          
                          // If both have played, sort by score (fixed comparison to ensure proper number comparison)
                          if (a.hasPlayed && b.hasPlayed) {
                            // Make sure we're comparing numbers
                            const scoreA = typeof a.score === 'number' ? a.score : (isLowerBetter ? 999 : 0);
                            const scoreB = typeof b.score === 'number' ? b.score : (isLowerBetter ? 999 : 0);
                            
                            return isLowerBetter ? scoreA - scoreB : scoreB - scoreA;
                          }
                          
                          // If neither has played, keep original order
                          return 0;
                        })
                        .map((person, index) => {
                          // Find if this person is the top scorer (only among those who have played)
                          const isTopScore = person.hasPlayed && 
                            getAllFriendsList
                              .filter(p => p.hasPlayed)
                              .sort((a, b) => {
                                if (typeof a.score !== 'number' || typeof b.score !== 'number') {
                                  // Handle case where one or both scores aren't numbers
                                  const scoreA = typeof a.score === 'number' ? a.score : (isLowerBetter ? 999 : 0);
                                  const scoreB = typeof b.score === 'number' ? b.score : (isLowerBetter ? 999 : 0);
                                  return isLowerBetter ? scoreA - scoreB : scoreB - scoreA;
                                }
                                
                                // Both are numbers, safe to compare
                                return isLowerBetter ? a.score - b.score : b.score - a.score;
                              })
                              .findIndex(p => p.playerId === person.playerId) === 0;
                              
                          return (
                            <div 
                              key={person.playerId}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                person.isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50"
                              } ${isTopScore ? "border border-accent/20" : ""}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                                {isTopScore && (
                                  <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                )}
                                <div className="font-medium truncate">
                                  {person.playerName}
                                </div>
                                {isTopScore && (
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
                          );
                        })
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No scores found for today.</p>
                        <p className="mt-2">Add your scores for the day and they will appear here.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              {/* By Group tab content - moved to be second */}
              <TabsContent value="groups" className="space-y-6">
                {groupPerformanceData.length > 0 ? (
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
                          // Fixed comparison to ensure proper number comparison
                          const scoreA = typeof a.score === 'number' ? a.score : (isLowerBetter ? 999 : 0);
                          const scoreB = typeof b.score === 'number' ? b.score : (isLowerBetter ? 999 : 0);
                          
                          return isLowerBetter ? scoreA - scoreB : scoreB - scoreA;
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
                                      <span className="truncate">{group.groupName} {selectedGame?.name || ''} Scores</span>
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
                                        <span className={cn(isMobile ? "sr-only" : "")}>Share</span>
                                      </Button>
                                    </GroupScoresShare>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenMessages(group.groupId, group.groupName)}
                                      className="flex items-center justify-center gap-1"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                      <span className={cn(isMobile ? "sr-only" : "")}>Message</span>
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Group members with scores */}
                                <div className="space-y-1 mt-2">
                                  {sortedMembers.length > 0 ? (
                                    // People who have played, sorted by score
                                    sortedMembers.map((member, i) => {
                                      const isFirst = i === 0;
                                      return (
                                        <div
                                          key={`${member.playerId}-played`}
                                          className={`flex items-center justify-between p-3 rounded-lg ${
                                            member.isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50"
                                          } ${isFirst ? "border border-accent/20" : ""}`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                                            {isFirst && (
                                              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                            )}
                                            <div className="font-medium truncate">
                                              {member.playerName}
                                            </div>
                                            {isFirst && (
                                              <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                                Top score
                                              </span>
                                            )}
                                          </div>
                                          <span className="font-semibold">{member.score}</span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-center py-3 text-muted-foreground">
                                      <p>No one has played {selectedGame?.name} today</p>
                                    </div>
                                  )}
                                  
                                  {/* People who haven't played yet */}
                                  {notPlayedMembers.length > 0 && (
                                    <>
                                      {sortedMembers.length > 0 && (
                                        <div className="text-xs text-muted-foreground my-2 px-3">
                                          Not played yet
                                        </div>
                                      )}
                                      
                                      {notPlayedMembers.map(member => (
                                        <div
                                          key={`${member.playerId}-not-played`}
                                          className={`flex items-center justify-between p-3 rounded-lg ${
                                            member.isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50"
                                          }`}
                                        >
                                          <div className="font-medium">{member.playerName}</div>
                                          <span className="text-sm text-muted-foreground">No score yet</span>
                                        </div>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </>
                          </div>
                        </Card>
                      );
                    })}
                    
                    <div className="flex justify-center">
                      <Button
                        onClick={() => handleOpenConnectionsModal('groups')}
                        variant="outline"
                        className="gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Manage Groups
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card className="p-8 flex flex-col items-center justify-center text-center">
                    <Users className="w-12 h-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Friend Groups</h2>
                    <p className="text-muted-foreground mb-4">
                      Create groups of friends to track your scores together.
                    </p>
                    <Button 
                      onClick={() => handleOpenConnectionsModal('groups')}
                      variant="default"
                      className="gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Create Group
                    </Button>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      
      {/* Group Messages Modal */}
      <GroupMessagesModal
        open={showMessages}
        onOpenChange={setShowMessages}
        groupId={selectedGroupForMessages?.id || ''}
        groupName={selectedGroupForMessages?.name || ''}
      />
      
      {/* Connections Modal for managing friends and groups */}
      <ConnectionsModal
        open={connectionsModalOpen}
        onOpenChange={setConnectionsModalOpen}
        currentPlayerId={user?.id || ''}
        defaultTab={activeConnectionsTab}
      />
    </div>
  );
};

export default TodayScores;
