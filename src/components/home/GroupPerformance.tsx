
import React from 'react';
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

interface GroupPerformanceProps {
  selectedGame: Game | null;
  todaysGames: any[];
  className?: string;
}

const GroupPerformance = ({ selectedGame, todaysGames, className = '' }: GroupPerformanceProps) => {
  const { user } = useAuth();
  const { isLoading, groupPerformanceData } = useGroupScores(
    selectedGame?.id || null,
    todaysGames
  );
  const isMobile = useIsMobile();
  
  // Helper function to determine the leading player in a group
  const getLeadingPlayerInGroup = (group: typeof groupPerformanceData[0]) => {
    // For games like Wordle and Mini Crossword, lower scores are better
    const isLowerBetter = ['wordle', 'mini-crossword'].includes(selectedGame?.id || '');
    
    // Combine current user and members into one array to find the leading player
    const allPlayers = [
      ...(group.currentUserHasPlayed ? [{
        playerId: 'currentUser',
        score: group.currentUserScore,
        isCurrentUser: true
      }] : []),
      ...group.members
        .filter(m => m.hasPlayed && m.score !== null)
        .map(m => ({
          playerId: m.playerId,
          score: m.score,
          isCurrentUser: false
        }))
    ];
    
    if (allPlayers.length === 0) return null;
    
    // Sort players by score (according to game type)
    const sortedPlayers = [...allPlayers].sort((a, b) => {
      if (isLowerBetter) {
        return (a.score || 999) - (b.score || 999);
      } else {
        return (b.score || 0) - (a.score || 0);
      }
    });
    
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
              const leadingPlayer = getLeadingPlayerInGroup(group);
              const userIsLeading = leadingPlayer?.isCurrentUser;
              const groupMemberScores = convertToGroupMemberScores(group.members);
              
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
                  
                  {/* Current user's score */}
                  <div className="mb-3 bg-secondary/30 p-2 rounded-md mt-2">
                    <div className="flex items-center justify-between font-medium">
                      <span>Your score:</span>
                      {group.currentUserHasPlayed ? (
                        <span className="font-bold">{group.currentUserScore}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Not played today</span>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-medium mb-1 text-muted-foreground">Group Members</h4>
                  <div className="space-y-1">
                    {group.members.length > 0 ? (
                      group.members.map((member) => (
                        <div 
                          key={member.playerId} 
                          className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                        >
                          <div className="flex items-center gap-1 min-w-0 max-w-[70%]">
                            <span className="truncate">{member.playerName}</span>
                            {!leadingPlayer?.isCurrentUser && leadingPlayer?.playerId === member.playerId && (
                              <Badge className="bg-amber-500 ml-1 px-1 py-0 h-4 text-[10px] shrink-0">
                                <Trophy className="w-2 h-2 mr-0.5" />
                                Leader
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {member.hasPlayed ? (
                              <>
                                <span className="text-sm font-medium">{member.score}</span>
                                <Check className="w-4 h-4 text-green-500" />
                              </>
                            ) : (
                              <X className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No members in this group</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {group.members.filter(m => m.hasPlayed).length} of {group.members.length} members played today
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
