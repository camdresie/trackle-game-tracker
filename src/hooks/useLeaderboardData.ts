import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

export const useLeaderboardData = (userId: string | undefined) => {
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
        
        // Transform the data to ensure we get the correct profile data
        const transformedData = data.map((stat: any) => {
          // Correctly handle the profile data structure from Supabase
          // The profiles data comes as an array from the join
          if (stat.profiles && Array.isArray(stat.profiles) && stat.profiles.length > 0) {
            return {
              ...stat,
              profiles: stat.profiles[0] // Use the first profile in the array
            };
          }
          
          // If profiles is already an object (not an array), keep it as is
          if (stat.profiles && typeof stat.profiles === 'object' && !Array.isArray(stat.profiles)) {
            return stat;
          }
          
          // If no profile data found, use a placeholder but log this issue
          console.error('Missing profile data for user ID:', stat.user_id);
          return {
            ...stat,
            profiles: {
              id: stat.user_id,
              username: `Unknown Player`, // Better placeholder
              full_name: null,
              avatar_url: null
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
    enabled: !!userId
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
    enabled: !!userId
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
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
          
        if (error) throw error;
        
        // Extract the friend IDs
        const friendIds = data.map(connection => {
          // If the user is the user_id, return the friend_id, otherwise return the user_id
          return connection.user_id === userId ? connection.friend_id : connection.user_id;
        });
        
        console.log('Friends data:', friendIds);
        return friendIds;
      } catch (error) {
        console.error('Error fetching friends:', error);
        toast.error('Failed to load friends data');
        return [];
      }
    },
    enabled: !!userId && showFriendsOnly
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
        userStatsMap.set(userId, {
          player_id: userId,
          username: profile.username || "Unknown Player", // Use the actual username or fallback
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
  
  return {
    selectedGame,
    setSelectedGame,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    showFriendsOnly,
    setShowFriendsOnly,
    timeFilter,
    setTimeFilter,
    filteredAndSortedPlayers,
    isLoading,
    scoresData
  };
};
