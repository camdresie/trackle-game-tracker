import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { games } from '@/utils/gameData';
import { useFriendsList } from '@/hooks/useFriendsList';
import { Player } from '@/utils/types';

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
  today_score: number | null; // Add today's score
  latest_play: string;
}

export const useLeaderboardData = (userId: string | undefined) => {
  // Initialize with the first game instead of 'all'
  const [selectedGame, setSelectedGame] = useState<string>(games.length > 0 ? games[0].id : '');
  const [sortBy, setSortBy] = useState<string>('totalScore');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today'>('all');
  
  // Get friends list
  const { friends } = useFriendsList();
  
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
    queryKey: ['scores', selectedGame, timeFilter],
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
  
  // Transform game stats data into leaderboard players format
  const getLeaderboardData = () => {
    if (!gameStatsData || !scoresData) return [];
    
    // Get today's date for filtering
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    
    // Initialize user stats map with profiles
    const userStatsMap = new Map();
    
    // First, initialize all players from game stats
    gameStatsData.forEach(stat => {
      const userId = stat.user_id;
      const profile = stat.profiles;
      
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          player_id: userId,
          username: profile.username || "Unknown Player", 
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          total_score: 0,
          best_score: 0,
          average_score: 0,
          total_games: 0,
          today_score: null,
          latest_play: null
        });
      }
    });
    
    // Filter scores for the current game
    const gameScores = scoresData.filter(score => score.game_id === selectedGame);
    
    // Log the filtered scores to debug
    console.log('Game wordle - Filtered scores:', gameScores);
    console.log('Today\'s date:', today);
    
    // Process scores to calculate statistics
    for (const userId of userStatsMap.keys()) {
      // Get all scores for this user for the selected game
      const userScores = gameScores.filter(score => score.user_id === userId);
      
      // Get today's scores (if any)
      const todayScores = userScores.filter(score => {
        const match = score.date === today;
        console.log(`Game ${selectedGame} - Score date: ${score.date}, Today: ${today}, Match: ${match}`);
        return match;
      });
      
      // If we're filtering by today and the user has no scores today, keep the user but mark the score as null
      // This way friends without scores today will still show up
      
      const userStats = userStatsMap.get(userId);
      
      if (userScores.length > 0) {
        // Calculate scores for all time
        const sumOfScores = userScores.reduce((sum, score) => sum + score.value, 0);
        const bestScore = ['wordle', 'mini-crossword'].includes(selectedGame) 
          ? Math.min(...userScores.map(score => score.value))
          : Math.max(...userScores.map(score => score.value));
        
        // Update all-time statistics
        userStats.total_games = userScores.length;
        userStats.best_score = bestScore;
        userStats.average_score = sumOfScores / userScores.length;
        userStats.total_score = sumOfScores;
        
        // Add today's score if available
        if (todayScores.length > 0) {
          // For today, we just use the most recent score of the day
          const todayScore = todayScores.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0].value;
          
          userStats.today_score = todayScore;
        } else if (timeFilter === 'today') {
          // If filtering by today but no score today, set to 0 (which will display as "-")
          userStats.today_score = 0;
        }
        
        // Update latest play date
        const latestScoreDate = new Date(Math.max(...userScores.map(s => new Date(s.date).getTime())));
        userStats.latest_play = latestScoreDate.toISOString().split('T')[0];
      } else if (timeFilter === 'today') {
        // If no scores at all and filtering by today, set to 0 (which will display as "-")
        userStats.today_score = 0;
      }
    }
    
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
    
    // Filter by friends
    if (showFriendsOnly) {
      if (selectedFriendIds.length > 0) {
        // Filter by selected specific friends and include current user
        filteredPlayers = filteredPlayers.filter(player => 
          player.player_id === userId || selectedFriendIds.includes(player.player_id)
        );
      } else {
        // Filter by all friends and include current user
        filteredPlayers = filteredPlayers.filter(player => 
          player.player_id === userId || friendIds.includes(player.player_id)
        );
      }
    }
    
    // Sort players based on time filter and sort by criteria
    return filteredPlayers.sort((a, b) => {
      // For "today only", sort by today's score
      if (timeFilter === 'today') {
        // Sort by today's score
        if (a.today_score !== null && b.today_score !== null) {
          if (['wordle', 'mini-crossword'].includes(selectedGame)) {
            // Specifically for Wordle, handle '-' scores as 0 (no score) and put them at the bottom
            if (selectedGame === 'wordle') {
              // If either score is 0, it means no score (represented as '-' in UI)
              if (a.today_score === 0 && b.today_score === 0) return 0;
              if (a.today_score === 0) return 1; // Push a to the bottom
              if (b.today_score === 0) return -1; // Push b to the bottom
            }
            return a.today_score - b.today_score; // Lower is better
          } else {
            return b.today_score - a.today_score; // Higher is better
          }
        }
        // If one player has a score and the other doesn't, prioritize the one with a score
        if (a.today_score !== null && b.today_score === null) return -1;
        if (a.today_score === null && b.today_score !== null) return 1;
        // If neither player has a score, keep original order
        return 0;
      } else {
        // Sort by the selected criteria for all-time
        switch (sortBy) {
          case 'totalScore':
            return b.total_score - a.total_score;
          case 'bestScore':
            // For games where lower is better (like Wordle), reverse the sorting
            if (['wordle', 'mini-crossword'].includes(selectedGame)) {
              // Specifically for Wordle, handle scores of 0 (no score) by putting them at the bottom
              if (selectedGame === 'wordle') {
                // If either score is 0, it means no score (represented as '-' in UI)
                if (a.best_score === 0 && b.best_score === 0) return 0;
                if (a.best_score === 0) return 1; // Push a to the bottom
                if (b.best_score === 0) return -1; // Push b to the bottom
                // Otherwise, lower is better for Wordle
                return a.best_score - b.best_score;
              }
              return a.best_score - b.best_score;
            }
            return b.best_score - a.best_score;
          case 'totalGames':
            return b.total_games - a.total_games;
          case 'averageScore':
            // For games where lower is better (like Wordle), reverse the sorting
            if (['wordle', 'mini-crossword'].includes(selectedGame)) {
              // Specifically for Wordle, handle scores of 0 (no score) by putting them at the bottom
              if (selectedGame === 'wordle') {
                // If either score is 0, it means no score (represented as '-' in UI)
                if (a.average_score === 0 && b.average_score === 0) return 0;
                if (a.average_score === 0) return 1; // Push a to the bottom
                if (b.average_score === 0) return -1; // Push b to the bottom
                // Otherwise, lower is better for Wordle
                return a.average_score - b.average_score;
              }
              return a.average_score - b.average_score;
            }
            return b.average_score - a.average_score;
          default:
            // For games where lower is better (like Wordle), sort by best score (lowest first)
            if (['wordle', 'mini-crossword'].includes(selectedGame)) {
              // Specifically for Wordle, handle scores of 0 (no score) by putting them at the bottom
              if (selectedGame === 'wordle') {
                // If either score is 0, it means no score (represented as '-' in UI)
                if (a.best_score === 0 && b.best_score === 0) return 0;
                if (a.best_score === 0) return 1; // Push a to the bottom
                if (b.best_score === 0) return -1; // Push b to the bottom
                // Otherwise, lower is better for Wordle
                return a.best_score - b.best_score;
              }
              return a.best_score - b.best_score;
            }
            // For other games, sort by total score (highest first)
            return b.total_score - a.total_score;
        }
      }
    });
  };

  const filteredAndSortedPlayers = getFilteredAndSortedPlayers();
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
