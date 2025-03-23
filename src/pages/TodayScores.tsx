import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { useHomeData } from '@/hooks/useHomeData';
import { useGroupScores } from '@/hooks/useGroupScores';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GamepadIcon, Users, Trophy, ChevronRight, CalendarDays, MessageCircle, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { games } from '@/utils/gameData';
import GroupMessagesModal from '@/components/messages/GroupMessagesModal';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { getFormattedTodayInEasternTime } from '@/utils/dateUtils';

const TodayScores = () => {
  const { user } = useAuth();
  const {
    isLoading: isHomeDataLoading,
    gamesList,
    todaysGames,
    selectedGame,
    setSelectedGame,
  } = useHomeData();
  
  const [activeTab, setActiveTab] = useState<'groups' | 'friends'>('groups');
  const [showMessages, setShowMessages] = useState(false);
  const [selectedGroupForMessages, setSelectedGroupForMessages] = useState<{id: string, name: string} | null>(null);
  
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
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
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
        
        {/* Game Selector Pills - Updated to match Leaderboard style */}
        <div className="mb-6">
          {/* First Row */}
          <div className="flex flex-wrap gap-2 mb-2">
            {games.slice(0, Math.ceil(games.length / 2)).map(game => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  selectedGame?.id === game.id 
                    ? `${game.color} text-white hover:bg-opacity-90`
                    : 'border border-muted hover:bg-muted/10'
                }`}
              >
                <GamepadIcon className="w-3.5 h-3.5" />
                <span>{game.name}</span>
              </button>
            ))}
          </div>
          
          {/* Second Row */}
          <div className="flex flex-wrap gap-2">
            {games.slice(Math.ceil(games.length / 2)).map(game => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  selectedGame?.id === game.id 
                    ? `${game.color} text-white hover:bg-opacity-90`
                    : 'border border-muted hover:bg-muted/10'
                }`}
              >
                <GamepadIcon className="w-3.5 h-3.5" />
                <span>{game.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Rest of the component */}
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
              onValueChange={(value) => setActiveTab(value as 'groups' | 'friends')}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>By Group</span>
                </TabsTrigger>
                <TabsTrigger value="friends" className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>All Friends</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="groups" className="space-y-6">
                <div className="space-y-6">
                  {groupPerformanceData.map((group) => {
                    const leadingPlayer = getLeadingPlayerInGroup(group);
                    
                    return (
                      <Card key={group.groupId} className="p-6 overflow-hidden">
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-accent" />
                              <h3 className="font-semibold text-xl">{group.groupName}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                                onClick={() => handleOpenMessages(group.groupId, group.groupName)}
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">Messages</span>
                              </Button>
                              <div className="flex items-center">
                                <span className={`inline-block w-3 h-3 rounded-full ${selectedGame.color} mr-2`}></span>
                                <span>{selectedGame.name}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Current user's score */}
                          <div className="mb-4 p-4 bg-secondary/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 font-medium">
                                <span>Your score today</span>
                                {leadingPlayer?.isCurrentUser && (
                                  <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex items-center">
                                    <Trophy className="w-3 h-3 mr-1" /> Leading
                                  </span>
                                )}
                              </div>
                              <div className="text-lg font-bold">
                                {group.currentUserHasPlayed 
                                  ? group.currentUserScore 
                                  : <span className="text-muted-foreground text-sm">No score yet</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Group members scores */}
                          <div className="space-y-3">
                            {group.members.length > 0 ? (
                              group.members.map((member) => (
                                <div 
                                  key={member.playerId} 
                                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-2 font-medium">
                                    <span>{member.playerName}</span>
                                    {leadingPlayer?.playerId === member.playerId && (
                                      <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex items-center">
                                        <Trophy className="w-3 h-3 mr-1" /> Leading
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center">
                                    {member.hasPlayed ? (
                                      <span className="font-semibold">{member.score}</span>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">No score yet</span>
                                    )}
                                    <ChevronRight className="ml-2 w-4 h-4 text-muted-foreground" />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                No members in this group
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="friends" className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-accent" />
                    All Friends' Today Scores
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Combine all friends from all groups */}
                    {groupPerformanceData.flatMap(group => group.members)
                      // Remove duplicates based on playerId
                      .filter((member, index, self) => 
                        index === self.findIndex(m => m.playerId === member.playerId)
                      )
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
                      .map((friend, index) => (
                        <div 
                          key={friend.playerId}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            index === 0 ? "bg-accent/10 border border-accent/20" : "hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {index === 0 && friend.hasPlayed && (
                              <Trophy className="w-4 h-4 text-amber-500" />
                            )}
                            <div className="font-medium">{friend.playerName}</div>
                            {index === 0 && friend.hasPlayed && (
                              <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full">
                                Top score
                              </span>
                            )}
                          </div>
                          <div>
                            {friend.hasPlayed ? (
                              <span className="font-semibold">{friend.score}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No score yet</span>
                            )}
                          </div>
                        </div>
                      ))
                    }
                    
                    {/* Show current user's position */}
                    {user && (
                      <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Your score today</div>
                          <div>
                            {groupPerformanceData.some(g => g.currentUserHasPlayed) ? (
                              <span className="font-semibold">
                                {groupPerformanceData.find(g => g.currentUserHasPlayed)?.currentUserScore}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No score yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
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
