
import { useState, useEffect } from 'react';
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
  
  // Fetch profiles first to ensure we have all user data
  const { data: profilesData } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
            
        if (error) throw error;
        
        console.log('Profiles retrieved:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast.error('Failed to load user profiles');
        return [];
      }
    },
    enabled: !!userId
  });

  // Fetch all game stats data
  const { data: gameStatsData, isLoading: isLoadingGameStats } = useQuery({
    queryKey: ['game_stats', selectedGame],
    queryFn: async () => {
      try {
        console.log('Fetching game stats data for game:', selectedGame);
        
        let query = supabase
          .from('game_stats')
          .select('*, profiles:user_id(id, username, full_name, avatar_url)');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Game stats data retrieved:', data?.length || 0, 'records');
        
        // Transform the data to match our expected format
        const transformedData = data?.map(item => {
          const profileData = item.profiles;
          
          // Ensure we have a single profile object
          const profile = profileData || {
            id: item.user_id,
            username: 'Unknown',
            full_name: null,
            avatar_url: null
          };
          
          return {
            ...item,
            profiles: {
              id: profile.id || item.user_id,
              username: profile.username || 'Unknown',
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            }
          };
        });
        
        console.log('Transformed game stats with profiles:', transformedData?.length || 0);
        return transformedData as GameStatsWithProfile[];
      } catch (error) {
        console.error('Error fetching game stats data:', error);
        toast.error('Failed to load game statistics');
        return [];
      }
    },
    enabled: !!userId && !!profilesData
  });
  
  // Fetch all scores data for the current game
  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['scores', selectedGame, 'all-users'],
    queryFn: async () => {
      try {
        console.log('Fetching ALL scores data for game:', selectedGame);
        
        let query = supabase
          .from('scores')
          .select('*, profiles:user_id(id, username, full_name, avatar_url)');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        const { data, error } = await query;
            
        if (error) throw error;
        
        console.log('Scores data retrieved:', data?.length || 0, 'records');
        console.log('Raw scores data sample:', data?.slice(0, 3));
        
        // Transform scores data to include profile information
        const transformedData = data?.map(item => {
          const profileData = item.profiles;
          
          // Ensure we have profile information
          const profile = profileData || {
            id: item.user_id,
            username: 'Unknown', 
            full_name: null,
            avatar_url: null
          };
          
          return {
            ...item,
            user_profile: profile
          };
        });
        
        return transformedData || [];
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
  
  // Debug: Check if camdresie is in any of our data sources
  useEffect(() => {
    if (profilesData) {
      const camdresie = profilesData.find(p => p.username === 'camdresie');
      console.log('Found camdresie in profiles?', camdresie ? 'YES' : 'NO', camdresie);
    }
    
    if (scoresData) {
      const camdresieScores = scoresData.filter(s => 
        s.user_profile && s.user_profile.username === 'camdresie'
      );
      console.log('camdresie scores:', camdresieScores.length, camdresieScores);
    }
  }, [profilesData, scoresData]);
  
  // Process leaderboard data - now with improved profile handling
  const leaderboardData = processLeaderboardData(
    gameStatsData,
    scoresData,
    selectedGame,
    friends,
    userId,
    profilesData
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
  
  // Debug: Check if camdresie exists in our final data
  useEffect(() => {
    const camdresieInLeaderboard = leaderboardData.find(p => p.username === 'camdresie');
    console.log('camdresie in processed leaderboard?', camdresieInLeaderboard ? 'YES' : 'NO', camdresieInLeaderboard);
    
    const camdresieInFilteredPlayers = filteredAndSortedPlayers.find(p => p.username === 'camdresie');
    console.log('camdresie in filtered players?', camdresieInFilteredPlayers ? 'YES' : 'NO', camdresieInFilteredPlayers);
  }, [leaderboardData, filteredAndSortedPlayers]);
  
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
