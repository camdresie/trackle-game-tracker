
import React, { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import ScoreChart from '@/components/ScoreChart';
import { Game, Player, Score } from '@/utils/types';
import { Users, RefreshCcw } from 'lucide-react';

interface FriendScoresListProps {
  game: Game;
  friends: Player[];
  friendScores: { [key: string]: Score[] };
  onManageFriends?: () => void;
  onRefreshFriends?: () => void;
}

const FriendScoresList = ({ game, friends, friendScores, onManageFriends, onRefreshFriends }: FriendScoresListProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Friend Scores</h2>
        {friends.length > 0 && onRefreshFriends && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefreshFriends}
            className="gap-1"
          >
            <RefreshCcw className="h-3 w-3" />
            Refresh
          </Button>
        )}
      </div>
      
      {friends.length > 0 ? (
        <div className="space-y-6">
          {friends.map(friend => {
            const friendScoresList = friendScores[friend.id] || [];
            const bestFriendScore = friendScoresList.length > 0
              ? game.id === 'wordle'
                ? Math.min(...friendScoresList.map(s => s.value))
                : Math.max(...friendScoresList.map(s => s.value))
              : null;
            
            return (
              <div key={friend.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>{friend.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium">{friend.name}</h3>
                  </div>
                  
                  <div className="text-sm">
                    Best: <span className="font-semibold">
                      {bestFriendScore !== null ? bestFriendScore : '-'}
                    </span>
                  </div>
                </div>
                
                {friendScoresList.length > 0 ? (
                  <div className="h-32">
                    <ScoreChart 
                      scores={friendScoresList.slice(-20)} 
                      gameId={game.id}
                      color={game.color.replace('bg-', '')}
                      simplified={true}
                    />
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground bg-secondary/20 rounded-lg">
                    No scores recorded
                  </div>
                )}
                
                <Separator />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-2">You haven't added any friends yet</p>
          <Button 
            variant="outline" 
            onClick={onManageFriends}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Add Friends
          </Button>
        </div>
      )}
    </>
  );
};

export default FriendScoresList;
