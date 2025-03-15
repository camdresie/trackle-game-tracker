
import React from 'react';
import { Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerCard from '@/components/PlayerCard';
import { games } from '@/utils/gameData';

interface LeaderboardPlayer {
  player_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_score: number;
  best_score: number;
  average_score: number;
  total_games: number;
  today_score: number | null;
}

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
  console.log('Leaderboard players:', players);
  console.log('Time filter:', timeFilter);
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading leaderboard data...</p>
        </div>
      ) : players.length > 0 ? (
        players.map((player, index) => (
          <PlayerCard 
            key={player.player_id}
            player={{
              id: player.player_id,
              name: player.username, // Use the username directly
              avatar: player.avatar_url || undefined
            }}
            rank={index + 1}
            scores={[]} // We'll load these on demand
            game={gameObj}
            stats={{
              // Format scores appropriately for Wordle (display "-" for 0 scores)
              bestScore: selectedGame === 'wordle' && 
                        (timeFilter === 'today' ? player.today_score === 0 : player.best_score === 0) 
                        ? 0 : // Pass 0 for the component to display as '-'
                        (timeFilter === 'today' ? player.today_score || 0 : player.best_score),
              totalScore: timeFilter === 'today' ? player.today_score || 0 : player.total_score,
              // Display rounded average score to one decimal place or today's score if filtering by today
              averageScore: selectedGame === 'wordle' && 
                          (timeFilter === 'today' ? player.today_score === 0 : player.average_score === 0)
                          ? 0 : // Pass 0 for the component to display as '-'
                          (timeFilter === 'today' 
                            ? player.today_score || 0 
                            : Math.round(player.average_score * 10) / 10),
              totalGames: timeFilter === 'today' ? (player.today_score ? 1 : 0) : player.total_games
            }}
            className="hover:scale-[1.01] transition-transform duration-200"
            showTodayOnly={timeFilter === 'today'} // Pass the timeFilter as a boolean
          />
        ))
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
