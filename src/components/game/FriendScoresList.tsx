
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import ScoreChart from '@/components/ScoreChart';
import { Game, Player, Score } from '@/utils/types';
import { Users, RefreshCcw, AlertCircle, PlusCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { addGameScore } from '@/services/gameStatsService';
import { supabase } from '@/lib/supabase';

interface FriendScoresListProps {
  game: Game;
  friends: Player[];
  friendScores: { [key: string]: Score[] };
  isLoading?: boolean;
  onManageFriends?: () => void;
  onRefreshFriends?: () => void;
}

const FriendScoresList = ({ 
  game, 
  friends, 
  friendScores, 
  isLoading = false,
  onManageFriends, 
  onRefreshFriends 
}: FriendScoresListProps) => {
  const [hasAddedTestScores, setHasAddedTestScores] = useState(false);
  const [addingTestData, setAddingTestData] = useState(false);
  
  // Debug logs on mount and when props change
  useEffect(() => {
    console.log("[FriendScoresList] Rendering with props:", { 
      gameId: game?.id,
      friendsCount: friends?.length, 
      friendScoresKeys: Object.keys(friendScores || {}),
      isLoading
    });
    
    // Check if we have any actual scores data
    const actualScoresCount = Object.values(friendScores || {}).reduce(
      (total, scores) => total + scores.length, 0
    );
    console.log(`[FriendScoresList] Total actual scores available: ${actualScoresCount}`);
  }, [game, friends, friendScores, isLoading]);
  
  // Function to handle refresh button click with enhanced feedback
  const handleRefreshClick = () => {
    console.log("[FriendScoresList] Refresh friends button clicked");
    
    // Show immediate feedback toast
    toast({
      description: "Refreshing friend data..."
    });
    
    if (onRefreshFriends) {
      // Call the refresh function provided by parent
      try {
        onRefreshFriends();
        console.log("[FriendScoresList] Friend refresh function called successfully");
      } catch (error) {
        console.error("[FriendScoresList] Error during friend refresh:", error);
        toast({
          title: "Error",
          description: "Failed to refresh friend data",
          variant: "destructive"
        });
      }
    } else {
      console.warn("[FriendScoresList] No refresh handler provided");
    }
  };
  
  // Function to add test scores for the first friend for debugging
  const addTestScores = async () => {
    if (friends.length === 0 || !game) return;
    
    try {
      setAddingTestData(true);
      
      // Get the first friend
      const friend = friends[0];
      
      console.log(`[FriendScoresList] Inserting test scores for friend ${friend.name} (${friend.id})`);
      
      // Generate some example scores directly with Supabase
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // Format dates to YYYY-MM-DD
      const formatDate = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };
      
      // Insert test scores for the last 3 days
      const { data, error } = await supabase
        .from('scores')
        .insert([
          {
            game_id: game.id,
            user_id: friend.id,
            value: 3,
            date: formatDate(today),
            notes: 'Test score for today'
          },
          {
            game_id: game.id,
            user_id: friend.id,
            value: 4,
            date: formatDate(yesterday),
            notes: 'Test score for yesterday'
          },
          {
            game_id: game.id,
            user_id: friend.id,
            value: 5,
            date: formatDate(twoDaysAgo),
            notes: 'Test score for 2 days ago'
          }
        ])
        .select();
      
      if (error) {
        console.error('[FriendScoresList] Error adding test scores:', error);
        toast({
          title: "Error",
          description: "Failed to add test scores",
          variant: "destructive"
        });
        return;
      }
      
      console.log('[FriendScoresList] Successfully added test scores:', data);
      
      // Refresh friend scores
      if (onRefreshFriends) {
        onRefreshFriends();
      }
      
      setHasAddedTestScores(true);
      
      toast({
        title: "Success",
        description: `Added test scores for ${friend.name}`,
      });
    } catch (error) {
      console.error('[FriendScoresList] Error in addTestScores:', error);
      toast({
        title: "Error",
        description: "Failed to add test scores",
        variant: "destructive"
      });
    } finally {
      setAddingTestData(false);
    }
  };

  // Detailed debug logs
  console.log("FriendScoresList rendering with friends:", friends.length);
  console.log("Friend scores keys:", Object.keys(friendScores));
  console.log("All friend scores data:", friendScores);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Friend Scores</h2>
        <div className="flex gap-2">
          {!hasAddedTestScores && friends.length > 0 && (
            <Button 
              variant="outline"
              size="sm" 
              onClick={addTestScores}
              className="gap-1"
              disabled={addingTestData || isLoading}
            >
              <PlusCircle className="h-3 w-3" />
              {addingTestData ? 'Adding Test Data...' : 'Add Test Scores'}
            </Button>
          )}
          {friends.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefreshClick}
              className="gap-1"
              disabled={isLoading}
            >
              <RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </div>
      
      {isLoading && friends.length > 0 ? (
        <div className="space-y-6">
          {friends.map(friend => (
            <div key={friend.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-32 w-full" />
              <Separator />
            </div>
          ))}
        </div>
      ) : friends.length > 0 ? (
        <div className="space-y-6">
          {friends.map(friend => {
            const friendScoresList = friendScores[friend.id] || [];
            console.log(`Rendering friend ${friend.name} with ${friendScoresList.length} scores:`, 
              friendScoresList.length > 0 ? friendScoresList : 'No scores');
            
            let bestFriendScore = null;
            if (friendScoresList.length > 0) {
              if (game.id === 'wordle' || game.id === 'mini-crossword' || game.id === 'quordle') {
                bestFriendScore = Math.min(...friendScoresList.map(s => s.value));
              } else {
                bestFriendScore = Math.max(...friendScoresList.map(s => s.value));
              }
            }
            
            return (
              <div key={friend.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>{friend.name?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
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
                  <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground bg-secondary/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 mb-2" />
                    <p>No scores recorded</p>
                    <p className="text-xs">Either your friend hasn't played this game or they're keeping their scores private</p>
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
