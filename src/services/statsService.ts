
import { supabase } from '@/lib/supabase';

/**
 * Get game statistics for a user
 */
export const getUserGameStats = async (userId: string): Promise<any[]> => {
  try {
    console.log(`[getUserGameStats] Fetching game stats for user ${userId}`);
    
    const { data, error } = await supabase
      .rpc('get_user_game_stats', { user_id_param: userId });
      
    if (error) {
      console.error('[getUserGameStats] Error fetching user game stats:', error);
      throw error;
    }
    
    console.log(`[getUserGameStats] Found ${data?.length || 0} game stats for user ${userId}:`, data);
    
    return data || [];
  } catch (error) {
    console.error('[getUserGameStats] Exception in getUserGameStats:', error);
    throw error;
  }
};

/**
 * Get a list of games that a user has played
 */
export const getPlayedGames = async (userId: string): Promise<string[]> => {
  try {
    console.log(`[getPlayedGames] Fetching played games for user ${userId}`);
    
    const { data, error } = await supabase
      .from('scores')
      .select('game_id')
      .eq('user_id', userId)
      .order('game_id')
      .limit(1000);
      
    if (error) {
      console.error('[getPlayedGames] Error fetching played games:', error);
      throw error;
    }
    
    // Get unique game IDs
    const uniqueGameIds = [...new Set(data.map(item => item.game_id))];
    
    console.log(`[getPlayedGames] Found ${uniqueGameIds.length} unique games played by user ${userId}:`, uniqueGameIds);
    
    return uniqueGameIds;
  } catch (error) {
    console.error('[getPlayedGames] Exception in getPlayedGames:', error);
    throw error;
  }
};

/**
 * Get the user's rank based on total games played
 */
export const getUserRankByTotalGamesPlayed = async (userId: string): Promise<{ rank: number, totalUsers: number }> => {
  try {
    console.log(`[getUserRank] Calculating rank for user ${userId}`);
    
    // Get all users' total game counts
    const { data, error } = await supabase
      .from('game_stats')
      .select('user_id, total_plays');
      
    if (error) {
      console.error('[getUserRank] Error fetching game stats for ranking:', error);
      throw error;
    }
    
    // Calculate total plays per user
    const userTotalPlays = new Map<string, number>();
    
    data.forEach(stat => {
      const currentUserId = stat.user_id;
      const currentTotalPlays = stat.total_plays || 0;
      
      if (userTotalPlays.has(currentUserId)) {
        userTotalPlays.set(currentUserId, userTotalPlays.get(currentUserId)! + currentTotalPlays);
      } else {
        userTotalPlays.set(currentUserId, currentTotalPlays);
      }
    });
    
    // Convert to array and sort by total plays (descending)
    const sortedUsers = Array.from(userTotalPlays.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Find the user's rank
    const userIndex = sortedUsers.findIndex(([id]) => id === userId);
    const rank = userIndex !== -1 ? userIndex + 1 : sortedUsers.length;
    
    console.log(`[getUserRank] User ${userId} is ranked ${rank} out of ${sortedUsers.length} by total games played`);
    
    return { rank, totalUsers: sortedUsers.length };
  } catch (error) {
    console.error('[getUserRank] Exception in getUserRank:', error);
    // Default to rank 1 if there's an error
    return { rank: 1, totalUsers: 1 };
  }
};
