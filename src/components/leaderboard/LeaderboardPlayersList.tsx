
import React from 'react';
import { Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerCard from '@/components/PlayerCard';
import { games } from '@/utils/gameData';
import { LeaderboardPlayer } from '@/types/leaderboard';

interface LeaderboardPlayersListProps {
  players: LeaderboardPlayer[];
  isLoading: boolean;
  selectedGame: string;
  showFriendsOnly: boolean;
  setShowFriendsOnly: (show: boolean) => void;
  timeFilter: 'all' | 'today';
  setTimeFilter: (filter: 'all' | 'today') => void;
}

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
  
  // Log player data for debugging
  console.log('LeaderboardPlayersList: timeFilter =', timeFilter);
  console.log('LeaderboardPlayersList: players count before display:', players.length);
  
  // Filter players for today view to only show those with today's scores
  const playersToDisplay = timeFilter === 'today' 
    ? players.filter(player => player.today_score !== null)
    : players;
  
  console.log('LeaderboardPlayersList: filtered players to display:', playersToDisplay.length);
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading leaderboard data...</p>
        </div>
      ) : playersToDisplay.length > 0 ? (
        playersToDisplay.map((player, index) => {
          return (
            <PlayerCard 
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
              className="hover:scale-[1.01] transition-transform duration-200"
              showTodayOnly={timeFilter === 'today'} // Pass the timeFilter as a boolean
            />
          );
        })
      ) : (
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No players found</p>
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

export default LeaderboardPlayersList;
