import React, { useEffect, useRef, memo } from 'react';
import { Loader2, User, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerCard from '@/components/PlayerCard';
import { games } from '@/utils/gameData';
import { LeaderboardPlayer } from '@/types/leaderboard';
import { FixedSizeList as List } from 'react-window';
import { useResizeObserver } from '@/hooks/useResizeObserver';

interface LeaderboardPlayersListProps {
  players: LeaderboardPlayer[];
  isLoading: boolean;
  selectedGame: string;
  showFriendsOnly: boolean;
  setShowFriendsOnly: (show: boolean) => void;
  timeFilter: 'all' | 'today';
  setTimeFilter: (filter: 'all' | 'today') => void;
}

// Memoize the PlayerCard rendering for better performance
const MemoizedPlayerCard = memo(PlayerCard);

// Player row height - reduced for tighter UI
const PLAYER_CARD_HEIGHT = 120;

const LeaderboardPlayersList = ({
  players,
  isLoading,
  selectedGame,
  showFriendsOnly,
  setShowFriendsOnly,
  timeFilter,
  setTimeFilter
}: LeaderboardPlayersListProps) => {
  // Find the selected game object
  const gameObj = games.find(game => game.id === selectedGame);
  const playerListRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(playerListRef);
  
  // For today view, only show players who have a today_score
  const playersToDisplay = timeFilter === 'today' 
    ? players.filter(player => player.today_score !== null)
    : players;
  
  
  return (
    <div className="space-y-4">
      {/* Time zone message - only show for today filter */}
      {timeFilter === 'today' && (
        <div className="bg-muted/60 rounded-lg p-3 flex items-center gap-2 text-sm">
          <InfoIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-muted-foreground">
            Today's scores reset at midnight Eastern Time (ET).
          </p>
        </div>
      )}
      
      {/* Players limit message */}
      {playersToDisplay.length === 25 && (
        <div className="bg-muted/60 rounded-lg p-3 flex items-center gap-2 text-sm mt-2">
          <InfoIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-muted-foreground">
            Showing top 25 players. Use filters to narrow results if needed.
          </p>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading leaderboard data...</p>
        </div>
      ) : playersToDisplay.length > 0 ? (
        <div className="space-y-3" ref={playerListRef}>
          {playersToDisplay.map((player, index) => (
            <MemoizedPlayerCard 
              key={player.player_id}
              player={{
                id: player.player_id,
                name: player.username,
                avatar: player.avatar_url || undefined
              }}
              rank={index + 1}
              scores={[]} // We'll load these on demand
              game={gameObj}
              stats={{
                // For today view, use today's score; otherwise use best score
                bestScore: timeFilter === 'today' 
                  ? (player.today_score !== null ? player.today_score : 0)
                  : player.best_score,
                totalScore: timeFilter === 'today' 
                  ? (player.today_score !== null ? player.today_score : 0)
                  : player.total_score,
                averageScore: timeFilter === 'today'
                  ? (player.today_score !== null ? player.today_score : 0)
                  : Math.round(player.average_score * 10) / 10,
                // Always show total games played regardless of timeFilter
                totalGames: player.total_games
              }}
              className="hover:scale-[1.01] transition-transform duration-200 mb-2"
              showTodayOnly={timeFilter === 'today'} // Pass the timeFilter as a boolean
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          {timeFilter === 'today' ? (
            <>
              <p className="text-muted-foreground">No scores found for today</p>
              <p className="text-sm text-muted-foreground mt-1">
                Either no one has logged today's scores yet, or there may be a timezone mismatch
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No players found</p>
          )}
          
          {showFriendsOnly && (
            <Button 
              variant="link" 
              className="mt-2" 
              onClick={() => setShowFriendsOnly(false)}
            >
              View all players
            </Button>
          )}
          
          {timeFilter === 'today' && (
            <Button 
              variant="link" 
              className="mt-2" 
              onClick={() => setTimeFilter('all')}
            >
              View all-time stats
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Memoize the entire component for better performance
export default memo(LeaderboardPlayersList);
