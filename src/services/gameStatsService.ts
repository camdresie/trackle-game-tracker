import { supabase } from '@/lib/supabase';
import { Score, Game } from '@/utils/types';
import { format } from 'date-fns';

/**
 * Get scores for a specific game from a user with optional date filtering
 */
export const getGameScores = async (
  gameId: string, 
  userId: string, 
  options?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<Score[]> => {
  try {
    let query = supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId);
    
    // Add date filtering if provided
    if (options?.startDate) {
      query = query.gte('date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('date', options.endDate);
    }
    
    // Add ordering and limit
    query = query.order('date', { ascending: false });
    
    // Limit results (default to 100 for performance)
    const limit = options?.limit ?? 100;
    query = query.limit(limit);
    
    const { data, error } = await query;
      
    if (error) {
      console.error('[getGameScores] Error fetching game scores:', error);
      throw error;
    }
    
    // Transform the data to match our Score type
    const scores = data.map(score => ({
      id: score.id,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes || '',
      createdAt: score.created_at
    }));
    
    return scores;
  } catch (error) {
    console.error('[getGameScores] Exception in getGameScores:', error);
    throw error;
  }
};

/**
 * Get today's games for a user
 */
export const getTodaysGames = async (userId: string): Promise<Score[]> => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);
      
    if (error) {
      console.error('[getTodaysGames] Error fetching today\'s games:', error);
      throw error;
    }
    
    // Transform the data to match our Score type
    const scores = data.map(score => ({
      id: score.id,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes || '',
      createdAt: score.created_at
    }));
    
    return scores;
  } catch (error) {
    console.error('[getTodaysGames] Exception in getTodaysGames:', error);
    throw error;
  }
};

/**
 * Get the game statistics for a specific user and game
 */
export const getGameStats = async (gameId: string, userId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      console.error('[getGameStats] Error fetching game stats:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[getGameStats] Exception in getGameStats:', error);
    throw error;
  }
};

/**
 * Get game statistics for a user across all games
 */
export const getUserGameStats = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_game_stats', { user_id_param: userId });
      
    if (error) {
      console.error('[getUserGameStats] Error fetching user game stats:', error);
      throw error;
    }
    
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
    
    return uniqueGameIds;
  } catch (error) {
    console.error('[getPlayedGames] Exception in getPlayedGames:', error);
    throw error;
  }
};

/**
 * Add a new score for a game
 */
export const addGameScore = async (scoreData: {
  gameId: string;
  playerId: string;
  value: number;
  date: string;
  notes?: string;
  createdAt: string;
}): Promise<{ stats: any; score: Score }> => {
  try {
    // Insert the score
    const { data, error } = await supabase
      .from('scores')
      .insert({
        game_id: scoreData.gameId,
        user_id: scoreData.playerId,
        value: scoreData.value,
        date: scoreData.date,
        notes: scoreData.notes || null
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('[addGameScore] Error adding score:', error);
      throw error;
    }
    
    // Update game stats for this game/user
    const { data: statsData, error: statsError } = await supabase
      .rpc('update_game_stats', {
        p_user_id: scoreData.playerId,
        p_game_id: scoreData.gameId,
        p_score: scoreData.value,
        p_date: scoreData.date
      });
      
    if (statsError) {
      console.error('[addGameScore] Error updating game stats:', statsError);
      // Continue despite stats error, the score was saved
    }
    
    // Format the response
    const scoreObj: Score = {
      id: data.id,
      gameId: data.game_id,
      playerId: data.user_id,
      value: data.value,
      date: data.date,
      notes: data.notes || '',
      createdAt: data.created_at
    };
    
    return {
      stats: statsData || null,
      score: scoreObj
    };
  } catch (error) {
    console.error('[addGameScore] Exception in addGameScore:', error);
    throw error;
  }
};
