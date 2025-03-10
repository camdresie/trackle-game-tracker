
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Users, 
  Search,
  Filter,
  User,
  ChevronsUpDown,
  UserPlus,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import NavBar from '@/components/NavBar';
import PlayerCard from '@/components/PlayerCard';
import { Game, Player, Score } from '@/utils/types';
import { games } from '@/utils/gameData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardPlayer {
  player_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_score: number;
  best_score: number;
  average_score: number;
  total_games: number;
  latest_play: string;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('totalScore');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  
  // Fetch leaderboard data
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', selectedGame],
    queryFn: async () => {
      try {
        if (selectedGame === 'all') {
          const { data, error } = await supabase
            .rpc('get_leaderboard');
            
          if (error) throw error;
          return data as LeaderboardPlayer[];
        } else {
          const { data, error } = await supabase
            .rpc('get_leaderboard', { game_id_param: selectedGame });
            
          if (error) throw error;
          return data as LeaderboardPlayer[];
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard data');
        return [];
      }
    },
    enabled: !!user
  });
  
  // Fetch friends data if needed
  const { data: friendsData, isLoading: isLoadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_friend_players', { user_id_param: user!.id });
          
        if (error) throw error;
        return data.map(friend => friend.player_id);
      } catch (error) {
        console.error('Error fetching friends:', error);
        toast.error('Failed to load friends data');
        return [];
      }
    },
    enabled: !!user && showFriendsOnly
  });
  
  // Get scores for a specific player
  const getScoresForPlayer = async (playerId: string): Promise<Score[]> => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', playerId)
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      return data.map(score => ({
        id: score.id,
        gameId: score.game_id,
        playerId: score.user_id,
        value: score.value,
        date: score.date,
        notes: score.notes || undefined
      }));
    } catch (error) {
      console.error('Error fetching player scores:', error);
      return [];
    }
  };
  
  // Get relevant game info
  const getSelectedGameObject = (): Game | undefined => {
    if (selectedGame === 'all') return undefined;
    return games.find(game => game.id === selectedGame);
  };
  
  // Filter and sort players
  const getFilteredAndSortedPlayers = () => {
    if (!leaderboardData) return [];
    
    let filteredPlayers = [...leaderboardData];
    
    // Filter by search term
    if (searchTerm) {
      filteredPlayers = filteredPlayers.filter(player => 
        player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.full_name && player.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by friends only
    if (showFriendsOnly && friendsData) {
      filteredPlayers = filteredPlayers.filter(player => 
        friendsData.includes(player.player_id)
      );
    }
    
    // Sort players
    return filteredPlayers.sort((a, b) => {
      switch (sortBy) {
        case 'totalScore':
          return b.total_score - a.total_score;
        case 'bestScore':
          return b.best_score - a.best_score;
        case 'totalGames':
          return b.total_games - a.total_games;
        case 'averageScore':
          return b.average_score - a.average_score;
        default:
          return b.total_score - a.total_score;
      }
    });
  };
  
  const filteredAndSortedPlayers = getFilteredAndSortedPlayers();
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">See who's winning across all games</p>
        </div>
        
        <div className="glass-card rounded-xl p-5 mb-6 animate-slide-up" style={{animationDelay: '100ms'}}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search players..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="friends-only"
                  checked={showFriendsOnly}
                  onCheckedChange={setShowFriendsOnly}
                />
                <label 
                  htmlFor="friends-only" 
                  className="text-sm cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Friends</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-auto">
                <Select 
                  value={selectedGame} 
                  onValueChange={setSelectedGame}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Game" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    {games.map(game => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-auto">
                <Select 
                  value={sortBy} 
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalScore">Total Score</SelectItem>
                    <SelectItem value="bestScore">Best Score</SelectItem>
                    <SelectItem value="totalGames">Games Played</SelectItem>
                    <SelectItem value="averageScore">Average Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {isLoadingLeaderboard || (showFriendsOnly && isLoadingFriends) ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading leaderboard data...</p>
              </div>
            ) : filteredAndSortedPlayers.length > 0 ? (
              filteredAndSortedPlayers.map((player, index) => (
                <PlayerCard 
                  key={player.player_id}
                  player={{
                    id: player.player_id,
                    name: player.username || player.full_name || 'Unknown Player',
                    avatar: player.avatar_url || undefined
                  }}
                  rank={index + 1}
                  scores={[]} // We'll load these on demand
                  game={getSelectedGameObject()}
                  className="hover:scale-[1.01] transition-transform duration-200"
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
              </div>
            )}
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{animationDelay: '200ms'}}>
          <h2 className="text-lg font-semibold mb-4">Stats Overview</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-semibold">
                {isLoadingLeaderboard ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  leaderboardData?.length || 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-semibold">{games.length}</div>
              <div className="text-sm text-muted-foreground">Games Tracked</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ChevronsUpDown className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-semibold">
                {isLoadingLeaderboard ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  leaderboardData?.reduce((sum, player) => sum + player.total_games, 0) || 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Scores</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <User className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-semibold">
                {isLoadingLeaderboard ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  filteredAndSortedPlayers[0]?.username || '-'
                )}
              </div>
              <div className="text-sm text-muted-foreground">Current Leader</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
