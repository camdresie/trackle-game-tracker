
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Check, X, Users, Gamepad2 } from 'lucide-react';
import { Game } from '@/utils/types';
import { useGroupScores } from '@/hooks/useGroupScores';

interface GroupPerformanceProps {
  selectedGame: Game | null;
  todaysGames: any[];
  className?: string;
}

const GroupPerformance = ({ selectedGame, todaysGames, className = '' }: GroupPerformanceProps) => {
  const { isLoading, groupPerformanceData } = useGroupScores(
    selectedGame?.id || null,
    todaysGames
  );
  
  console.log('[GroupPerformance] Render with data:', {
    selectedGame: selectedGame?.name,
    isLoading,
    groupsCount: groupPerformanceData.length,
    todaysGamesCount: todaysGames.length
  });
  
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
              <Badge variant="outline" className={`ml-auto ${selectedGame.color} bg-opacity-15`}>
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
  
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span>Friend Groups</span>
          {selectedGame && (
            <Badge variant="outline" className={`ml-auto ${selectedGame.color} bg-opacity-15`}>
              {selectedGame.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-64">
          <div className="space-y-4">
            {groupPerformanceData.map((group) => (
              <div key={group.groupId} className="rounded-md border p-3">
                <h3 className="font-medium mb-2">{group.groupName}</h3>
                <div className="space-y-1">
                  {group.members.length > 0 ? (
                    group.members.map((member) => (
                      <div 
                        key={member.playerId} 
                        className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                      >
                        <span>{member.playerName}</span>
                        <div className="flex items-center gap-2">
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
                  {group.members.filter(m => m.hasPlayed).length} of {group.members.length} played today
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GroupPerformance;
