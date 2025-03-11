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
  Loader2,
  Calendar
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

interface GameStatsWithProfile {
  id: string;
  user_id: string;
  game_id: string;
  best_score: number;
  average_score: number;
  total_plays: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('totalScore');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today'>('all');
  
  // Fetch game stats data
  const { data: gameStatsData, isLoading: isLoadingGameStats } = useQuery({
    queryKey: ['game_stats', selectedGame, timeFilter],
    queryFn: async () => {
      try {
        console.log('Fetching game stats data...');
        
        let query = supabase
          .from('game_stats')
          .select(`
            id,
            user_id,
            game_id,
            best_score,
            average_score,
            total_plays,
            current_streak,
            longest_streak,
            created_at,
            updated_at,
            profiles(id, username, full_name, avatar_url)
          `);
        
        if (selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        if (timeFilter === 'today') {
          // For today filter, we need to join with scores to filter by date
          query = query.filter('updated_at', 'gte', new Date().toISOString().split('T')[0]);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Game stats data:', data);
        
        // Transform the data to fix the profiles structure
        const transformedData = data.map((stat: any) => {
          // Check if profiles exists and is an array with at least one element
          if (!stat.profiles || !Array.isArray(stat.profiles) || stat.profiles.length === 0) {
            // Fetch the profile directly using a separate query
            return {
              ...stat,
              profiles: {
                id: stat.user_id,
                username: `Player ${stat.user_id.substring(0, 4)}`, // Generate a placeholder name
                full_name: null,
                avatar_url: null
              }
            };
          }
          
          // Fix for the user display issue - use actual username, not placeholder
          return {
            ...stat,
            profiles: {
              ...stat.profiles[0],
              // Ensure username is never null or undefined, but use the actual username if available
              username: stat.profiles[0].username || `Player ${stat.user_id.substring(0, 4)}`
            }
          };
        });
        
        console.log('Transformed data:', transformedData);
        return transformedData as GameStatsWithProfile[];
      } catch (error) {
        console.error('Error fetching game stats data:', error);
        toast.error('Failed to load game statistics');
        return [];
      }
    },
    enabled: !!user
  });
  
  // Fetch scores data to properly display latest scores and calculate today's data
  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['scores', selectedGame, timeFilter],
    queryFn: async () => {
      try {
        console.log('Fetching scores data...');
        
        let query = supabase
          .from('scores')
          .select('*');
        
        if (selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        if (timeFilter === 'today') {
          query = query.eq('date', new Date().toISOString().split('T')[0]);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Scores data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching scores data:', error);
        toast.error('Failed to load score data');
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
        console.log('Fetching friends data...');
        
        // Since the RPC function might not be working, let's use a direct query
        const { data, error } = await supabase
          .from('connections')
          .select(`
            id,
            user_id,
            friend_id,
            status,
            friend:friend_id(id, username, full_name, avatar_url),
            user:user_id(id, username, full_name, avatar_url)
          `)
          .eq('status', 'accepted')
          .or(`user_id.eq.${user!.id},friend_id.eq.${user!.id}`);
          
        if (error) throw error;
        
        // Extract the friend IDs
        const friendIds = data.map(connection => {
          // If the user is the user_id, return the friend_id, otherwise return the user_id
          return connection.user_id === user!.id ? connection.friend_id : connection.user_id;
        });
        
        console.log('Friends data:', friendIds);
        return friendIds;
      } catch (error) {
        console.error('Error fetching friends:', error);
        toast.error('Failed to load friends data');
        return [];
      }
    },
    enabled: !!user && showFriendsOnly
  });
  
  // Transform game stats data into leaderboard players format
  const getLeaderboardData = () => {
    if (!gameStatsData || !scoresData) return [];
    
    // Group by user_id
    const userStatsMap = new Map();
    
    gameStatsData.forEach(stat => {
      const userId = stat.user_id;
      const profile = stat.profiles;
      
      if (!userStatsMap.has(userId)) {
        // Use the actual username from the profile, not a placeholder
        const displayUsername = profile.username;
        
        userStatsMap.set(userId, {
          player_id: userId,
          username: displayUsername,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          total_score: 0,
          best_score: 0,
          average_score: 0,
          total_games: 0,
          latest_play: null
        });
      }
      
      const userStats = userStatsMap.get(userId);
      
      // Handle game-specific scoring
      let scoreValue = stat.best_score;
      
      // For all games, use the actual score value without negation
      userStats.total_score += scoreValue;
      userStats.best_score = Math.max(userStats.best_score, Math.abs(stat.best_score));
      userStats.total_games += stat.total_plays;
      userStats.average_score = userStats.total_games > 0 
        ? userStats.total_score / userStats.total_games 
        : 0;
      
      // Find the latest play date for this user
      const userScores = scoresData.filter(score => score.user_id === userId);
      if (userScores.length > 0) {
        const latestScoreDate = new Date(Math.max(...userScores.map(s => new Date(s.date).getTime())));
        if (!userStats.latest_play || new Date(userStats.latest_play) < latestScoreDate) {
          userStats.latest_play = latestScoreDate.toISOString().split('T')[0];
        }
      }
    });
    
    // Convert map to array
    return Array.from(userStatsMap.values());
  };
  
  // Filter and sort players
  const getFilteredAndSortedPlayers = () => {
    const leaderboardData = getLeaderboardData();
    if (!leaderboardData.length) return [];
    
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
  const isLoading = isLoadingGameStats || isLoadingScores || (showFriendsOnly && isLoadingFriends);
  
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
                  value={timeFilter} 
                  onValueChange={(value) => setTimeFilter(value as 'all' | 'today')}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
            {isLoading ? (
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
                  game={selectedGame !== 'all' ? games.find(game => game.id === selectedGame) : undefined}
                  stats={{
                    bestScore: player.best_score,
                    totalScore: player.total_score,
                    averageScore: player.average_score,
                    totalGames: player.total_games
                  }}
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
        </div>
        
        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{animationDelay: '200ms'}}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {timeFilter === 'all' ? (
              <>
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>All-Time Stats</span>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 text-green-500" />
                <span>Today's Stats</span>
              </>
            )}
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-semibold">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  filteredAndSortedPlayers.length || 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-semibold">
                {selectedGame === 'all' ? games.length : 1}
              </div>
              <div className="text-sm text-muted-foreground">Games Tracked</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ChevronsUpDown className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-semibold">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  scoresData?.length || 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Scores</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <User className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-semibold">
                {isLoading ? (
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
