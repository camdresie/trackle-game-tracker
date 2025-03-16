
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
