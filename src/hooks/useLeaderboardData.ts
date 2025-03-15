
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
  
  // Fetch all game stats data
  const { data: gameStatsData, isLoading: isLoadingGameStats } = useQuery({
    queryKey: ['game_stats', selectedGame],
    queryFn: async () => {
      try {
        console.log('Fetching game stats data for game:', selectedGame);
        
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
            profiles:profiles(id, username, full_name, avatar_url)
          `);
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Game stats data retrieved:', data?.length || 0, 'records');
        
        // Transform the data to match our expected type
        const transformedData = data?.map(item => {
          // Supabase returns profiles as an array with a single object
          // We need to extract that object to match our type
          const profileData = item.profiles?.[0] || {
            id: '',
            username: 'Unknown',
            full_name: null,
            avatar_url: null
          };
          
          return {
            ...item,
            profiles: profileData
          };
        });
        
        return transformedData as GameStatsWithProfile[];
      } catch (error) {
        console.error('Error fetching game stats data:', error);
        toast.error('Failed to load game statistics');
        return [];
      }
    },
    enabled: !!userId
  });
  
  // Fetch all scores data
  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['scores', selectedGame],
    queryFn: async () => {
      try {
        console.log('Fetching scores data for game:', selectedGame);
        
        let query = supabase
          .from('scores')
          .select('*');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Scores data retrieved:', data?.length || 0, 'records');
        return data;
      } catch (error) {
        console.error('Error fetching scores data:', error);
        toast.error('Failed to load score data');
        return [];
      }
    },
    enabled: !!userId
  });
  
  // Get the friend IDs
  const friendIds = friends.map(friend => friend.id);
  
  // Process leaderboard data
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
