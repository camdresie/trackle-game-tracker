import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Check, X, Users, Gamepad2, Trophy, Share2, MessageCircle } from 'lucide-react';
import { Game } from '@/utils/types';
import { useGroupScores } from '@/hooks/useGroupScores';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import GroupScoresShare from '@/components/groups/GroupScoresShare';
import { isDevelopment } from '@/utils/environment';

interface GroupPerformanceProps {
  selectedGame: Game | null;
  todaysGames: any[];
  className?: string;
}

// Define a consistent interface for group members
interface GroupMember {
  playerId: string;
  playerName: string;
  hasPlayed: boolean;
  score?: number | null;
  isCurrentUser?: boolean;
}

const GroupPerformance = ({ selectedGame, todaysGames, className = '' }: GroupPerformanceProps) => {
  const { user, profile } = useAuth();
  const { isLoading, groupPerformanceData } = useGroupScores(
    selectedGame?.id || null,
    todaysGames
  );
  const isMobile = useIsMobile();
  
  // Add logging to understand what data we're getting - only in development
  useEffect(() => {
    if (isDevelopment() && groupPerformanceData && groupPerformanceData.length > 0) {
      console.log("GroupPerformance: Raw group data received:", JSON.stringify(groupPerformanceData, null, 2));
      
      // Log specific group details for each group
      groupPerformanceData.forEach((group, index) => {
        console.log(`Group ${index + 1} - ${group.groupName}:`);
        console.log(`- Current user has played: ${group.currentUserHasPlayed}`);
        console.log(`- Current user score: ${group.currentUserScore}`);
        console.log(`- Member count: ${group.members.length}`);
        console.log(`- Members:`, group.members);
      });
    }
  }, [groupPerformanceData]);
  
  // Helper function to determine the leading player in a group
  const getLeadingPlayerInGroup = (group: typeof groupPerformanceData[0]) => {
    // For games like Wordle and Mini Crossword, lower scores are better
    const isLowerBetter = ['wordle', 'mini-crossword'].includes(selectedGame?.id || '');
    
    if (isDevelopment()) {
      console.log(`Group ${group.groupName}: Processing leading player determination`);
    }
    
    // Combine current user and members into one array to find the leading player
    const allPlayers = [
      ...(group.currentUserHasPlayed ? [{
        playerId: user?.id || '',
        score: group.currentUserScore,
        isCurrentUser: true
      }] : []),
      ...group.members
        .filter(m => m.hasPlayed && m.score !== null && m.playerId !== user?.id) // Filter out the current user from members to avoid duplicates
        .map(m => ({
          playerId: m.playerId,
          score: m.score,
          isCurrentUser: false
        }))
    ];
    
    if (isDevelopment()) {
      console.log(`Group ${group.groupName}: All players for leading determination:`, allPlayers);
    }
    
    if (allPlayers.length === 0) return null;
    
    // Sort players by score (according to game type)
    const sortedPlayers = [...allPlayers].sort((a, b) => {
      if (isLowerBetter) {
        return (a.score || 999) - (b.score || 999);
      } else {
        return (b.score || 0) - (a.score || 0);
      }
    });
    
    if (isDevelopment()) {
      console.log(`Group ${group.groupName}: Sorted players:`, sortedPlayers);
    }
    
    // Return the leading player
    return sortedPlayers[0];
  };
  
  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Friend Groups</span>
            <Skeleton className="h-4 w-24 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!selectedGame) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Friend Groups</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center gap-2 text-muted-foreground">
            <Gamepad2 className="h-10 w-10 opacity-40" />
            <p className="text-sm">
              Select a game above to see how your friend groups are performing today
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (groupPerformanceData.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Friend Groups</span>
            {selectedGame && (
              <Badge variant="outline" className="ml-auto truncate max-w-[120px] text-xs">
                {selectedGame.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center gap-2 text-muted-foreground">
            <Users className="h-10 w-10 opacity-40" />
            <p className="text-sm">
              You don't have any friend groups yet. Create groups to track your friends' performance!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Convert member data to GroupMemberScore format for share component
  const convertToGroupMemberScores = (members: any[]) => {
    return members.map(member => ({
      playerName: member.playerName,
      score: member.score,
      hasPlayed: member.hasPlayed
    }));
  };
  
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span className="truncate">Friend Groups</span>
          {selectedGame && (
            <Badge 
              variant="outline" 
              className="ml-auto truncate max-w-[120px] text-xs flex-shrink-0"
              style={{ backgroundColor: `rgba(var(--${selectedGame.color.replace('bg-', '')}-rgb), 0.15)` }}
            >
              {selectedGame.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-64">
          <div className="space-y-4">
            {groupPerformanceData.map((group) => {
              if (isDevelopment()) {
                console.log(`Rendering group: ${group.groupName}`);
              }
              const leadingPlayer = getLeadingPlayerInGroup(group);
              const userIsLeading = leadingPlayer?.isCurrentUser;
              const groupMemberScores = convertToGroupMemberScores(group.members);
              
              // FIXED: Create a combined list of all members with current user handling
              const allMembers: GroupMember[] = [];
              
              // First add the current user if they've played
              if (group.currentUserHasPlayed) {
                if (isDevelopment()) {
                  console.log(`Group ${group.groupName}: Adding current user with score ${group.currentUserScore}`);
                }
                allMembers.push({
                  playerId: user?.id || '',
                  playerName: profile?.username || 'You',
                  hasPlayed: true,
                  score: group.currentUserScore,
                  isCurrentUser: true
                });
              } else {
                if (isDevelopment()) {
                  console.log(`Group ${group.groupName}: Adding current user as not played`);
                }
                allMembers.push({
                  playerId: user?.id || '',
                  playerName: profile?.username || 'You',
                  hasPlayed: false,
                  score: null,
                  isCurrentUser: true
                });
              }
              
              // Then add all other members
              group.members.forEach(member => {
                if (member.playerId === user?.id) {
                  if (isDevelopment()) {
                    console.log(`Group ${group.groupName}: Skipping current user ${member.playerName} from members list`);
                  }
                  return; // Skip current user in members list since we added them already
                }
                
                if (isDevelopment()) {
                  console.log(`Group ${group.groupName}: Adding member ${member.playerName}`);
                }
                allMembers.push({
                  playerId: member.playerId,
                  playerName: member.playerName,
                  hasPlayed: member.hasPlayed,
                  score: member.score,
                  isCurrentUser: false
                });
              });
              
              if (isDevelopment()) {
                console.log(`Group ${group.groupName}: Final allMembers:`, allMembers);
              }
              
              // Sort members: first by played status, then by score
              const isLowerBetter = ['wordle', 'mini-crossword'].includes(selectedGame?.id || '');
              const sortedMembers = [...allMembers]
                .filter(m => m.hasPlayed && m.score !== null && m.score !== undefined)
                .sort((a, b) => {
                  if (isLowerBetter) {
                    return (a.score || 999) - (b.score || 999);
                  } else {
                    return (b.score || 0) - (a.score || 0);
                  }
                });
              const notPlayedMembers = allMembers.filter(m => !m.hasPlayed || m.score === null || m.score === undefined);
              
              if (isDevelopment()) {
                console.log(`Group ${group.groupName}: Sorted members:`, sortedMembers);
                console.log(`Group ${group.groupName}: Not played members:`, notPlayedMembers);
              }
              
              return (
                <div key={group.groupId} className="rounded-md border p-3">
                  {isMobile ? (
                    <div className="space-y-2">
                      {/* Group name on the top line for mobile - with full width */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-base">{group.groupName}</h3>
                        {userIsLeading && (
                          <Badge className="bg-amber-500 flex-shrink-0 text-xs">
                            <Trophy className="w-3 h-3 mr-1" /> Leading
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action buttons underneath on mobile */}
                      <div className="flex items-center space-x-2">
                        <GroupScoresShare
                          groupName={group.groupName}
                          gameName={selectedGame?.name || ""}
                          gameColor={selectedGame?.color || ""}
                          members={groupMemberScores}
                          currentUserName="You"
                          currentUserScore={group.currentUserScore}
                          currentUserHasPlayed={group.currentUserHasPlayed}
                          className="flex-1"
                        >
                          <Button 
                            variant="outline" 
                            className="w-full text-xs py-1 px-2 h-8 flex items-center justify-center"
                            size="sm"
                          >
                            <Share2 className="w-3.5 h-3.5 mr-1" />
                            Share Scores
                          </Button>
                        </GroupScoresShare>
                        <Button 
                          variant="outline" 
                          className="flex-1 text-xs py-1 px-2 h-8 flex items-center justify-center"
                          size="sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" />
                          Messages
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium truncate max-w-[70%]">{group.groupName}</h3>
                      {userIsLeading && (
                        <Badge className="bg-amber-500 flex-shrink-0 text-xs">
                          <Trophy className="w-3 h-3 mr-1" /> Leading
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Group members scores */}
                  <h4 className="text-sm font-medium mb-1 mt-2 text-muted-foreground">Group Members</h4>
                  <div className="space-y-1">
                    {sortedMembers.length > 0 ? (
                      sortedMembers.map((member, index) => (
                        <div 
                          key={`${member.playerId}-${index}`} 
                          className={`flex items-center justify-between text-sm py-1 border-b last:border-0 ${member.isCurrentUser ? 'bg-secondary/50 rounded-md px-2' : ''}`}
                        >
                          <div className="flex items-center gap-1 min-w-0 max-w-[70%]">
                            <span className="truncate">
                              {member.playerName}
                            </span>
                            {!leadingPlayer?.isCurrentUser && leadingPlayer?.playerId === member.playerId && (
                              <Badge className="bg-amber-500 ml-1 px-1 py-0 h-4 text-[10px] shrink-0">
                                <Trophy className="w-2 h-2 mr-0.5" />
                                Leader
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-sm font-medium">{member.score}</span>
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No scores recorded for this group today</div>
                    )}
                    
                    {/* Show unplayed members at the bottom */}
                    {notPlayedMembers.map((member, index) => (
                      <div 
                        key={`${member.playerId}-unplayed-${index}`} 
                        className={`flex items-center justify-between text-sm py-1 border-b last:border-0 text-muted-foreground ${member.isCurrentUser ? 'bg-secondary/50 rounded-md px-2' : ''}`}
                      >
                        <div className="flex items-center gap-1 min-w-0 max-w-[70%]">
                          <span className="truncate">
                            {member.playerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {allMembers.filter(m => m.hasPlayed).length} of {allMembers.length} members played today
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GroupPerformance;
