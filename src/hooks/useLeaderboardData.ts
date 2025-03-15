
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { games } from '@/utils/gameData';
import { useFriendsList } from '@/hooks/useFriendsList';
import { 
  processLeaderboardData, 
  filterAndSortPlayers 
} from '@/utils/leaderboardUtils';
import { 
  LeaderboardPlayer, 
  GameStatsWithProfile, 
  TimeFilter,
  SortByOption 
} from '@/types/leaderboard';

export const useLeaderboardData = (userId: string | undefined) => {
  // Initialize with the first game instead of 'all'
  const [selectedGame, setSelectedGame] = useState<string>(games.length > 0 ? games[0].id : '');
  const [sortBy, setSortBy] = useState<SortByOption>('totalScore');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  
  // Get friends list
  const { friends } = useFriendsList();
  
  // Fetch game stats data
  const { data: gameStatsData, isLoading: isLoadingGameStats } = useQuery({
    queryKey: ['game_stats', selectedGame],
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
        
        // Filter by selected game
        if (selectedGame) {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Game stats data:', data);
        
        // Transform the data to ensure we get the correct profile data
        const transformedData = data.map((stat: any) => {
          // Handle the profile data structure from Supabase
          if (stat.profiles) {
            return {
              ...stat,
              profiles: stat.profiles
            };
          }
          
          // If no profile data found, use a placeholder
          console.error('Missing profile data for user ID:', stat.user_id);
          return {
            ...stat,
            profiles: {
              id: stat.user_id,
              username: `Unknown Player`,
              full_name: null,
              avatar_url: null
            }
          };
        });
        
        console.log('Transformed game stats data:', transformedData);
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
    queryKey: ['scores', selectedGame],
    queryFn: async () => {
      try {
        console.log('Fetching scores data...');
        
        let query = supabase
          .from('scores')
          .select('*');
        
        // Filter by selected game
        if (selectedGame) {
          query = query.eq('game_id', selectedGame);
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
  
  // Get the friend IDs from the friends list
  const friendIds = friends.map(friend => friend.id);
  
  // Get leaderboard data from our utility function
  const leaderboardData = processLeaderboardData(
    gameStatsData,
    scoresData,
    selectedGame,
    friends,
    userId
  );
  
  // Filter and sort players
  const filteredAndSortedPlayers = filterAndSortPlayers(
    leaderboardData,
    searchTerm,
    showFriendsOnly,
    selectedFriendIds,
    timeFilter,
    sortBy,
    selectedGame,
    userId,
    friendIds
  );
  
  const isLoading = isLoadingGameStats || isLoadingScores;
  
  return {
    selectedGame,
    setSelectedGame,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    showFriendsOnly,
    setShowFriendsOnly,
    selectedFriendIds,
    setSelectedFriendIds,
    timeFilter,
    setTimeFilter,
    filteredAndSortedPlayers,
    isLoading,
    scoresData,
    friends
  };
};
