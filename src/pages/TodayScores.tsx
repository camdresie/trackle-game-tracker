
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { useHomeData } from '@/hooks/useHomeData';
import { useGroupScores } from '@/hooks/useGroupScores';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { GamepadIcon, Users, Trophy, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { games } from '@/utils/gameData';

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
  
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  
  // Determine if lower scores are better for the selected game
  const isLowerBetter = selectedGame?.id === 'wordle' || selectedGame?.id === 'mini-crossword';
  
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
        
        {/* Game Selector Pills - Styled like the leaderboard */}
        <div className="w-full overflow-x-auto py-2 mb-6">
          <ToggleGroup 
            type="single" 
            value={selectedGame?.id || ""} 
            onValueChange={(value) => value && handleGameSelect(value)}
            className="flex items-center gap-2 min-w-max"
          >
            {games.map(game => (
              <ToggleGroupItem 
                key={game.id} 
                value={game.id}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                  selectedGame?.id === game.id 
                    ? `${game.color} text-white hover:bg-opacity-90`
                    : 'border border-muted hover:bg-muted/10'
                )}
              >
                <GamepadIcon className="w-3.5 h-3.5" />
                <span>{game.name}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        
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
                  {groupPerformanceData.map((group) => (
                    <Card key={group.groupId} className="p-6 overflow-hidden">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-accent" />
                            <h3 className="font-semibold text-xl">{group.groupName}</h3>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-block w-3 h-3 rounded-full ${selectedGame.color} mr-2`}></span>
                            <span>{selectedGame.name}</span>
                          </div>
                        </div>
                        
                        {/* Current user's score */}
                        <div className="mb-4 p-4 bg-secondary/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 font-medium">
                              <span>Your score today</span>
                              {group.currentUserHasPlayed && group.members.every(m => 
                                !m.hasPlayed || (isLowerBetter 
                                  ? (group.currentUserScore || 999) <= (m.score || 999)
                                  : (group.currentUserScore || 0) >= (m.score || 0))
                              ) && (
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
                                <div className="font-medium">{member.playerName}</div>
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
                  ))}
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
    </div>
  );
};

export default TodayScores;
