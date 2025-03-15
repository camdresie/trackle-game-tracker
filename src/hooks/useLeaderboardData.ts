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
        
        // Always filter by selected game since we don't have 'all' anymore
        if (selectedGame) {
          query = query.eq('game_id', selectedGame);
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
    enabled: !!userId && !!selectedGame
  });
  
  // Fetch scores data to properly display latest scores and calculate today's data
  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['scores', selectedGame],
    queryFn: async () => {
      try {
        console.log('Fetching scores data...');
        
        // Don't filter by user ID to get scores for all users (including friends)
        let query = supabase
          .from('scores')
          .select('*');
        
        // Always filter by selected game since we don't have 'all' anymore
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
    enabled: !!userId && !!selectedGame
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
