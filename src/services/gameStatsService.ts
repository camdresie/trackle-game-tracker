
import { supabase } from '@/lib/supabase';
import { Score, Game } from '@/utils/types';
import { format } from 'date-fns';

/**
 * Get scores for a specific game from a user
 */
export const getGameScores = async (gameId: string, userId: string): Promise<Score[]> => {
  try {
    console.log(`[getGameScores] Fetching scores for game ${gameId} and user ${userId}`);
    
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .order('date', { ascending: false });
      
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
    
    console.log(`[getGameScores] Found ${scores.length} scores for game ${gameId}:`, scores);
    
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
    console.log(`[getTodaysGames] Fetching games for user ${userId} on ${today}`);
    
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
    
    console.log(`[getTodaysGames] Found ${scores.length} games for today:`, scores);
    
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
    console.log(`[getGameStats] Fetching stats for game ${gameId} and user ${userId}`);
    
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        console.log('[getGameStats] No stats found for this game and user');
        return null;
      }
      console.error('[getGameStats] Error fetching game stats:', error);
      throw error;
    }
    
    console.log('[getGameStats] Found game stats:', data);
    
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
    console.log('[addGameScore] Adding new score:', scoreData);
    
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
    
    console.log('[addGameScore] Score added successfully:', data);
    
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
    
    console.log('[addGameScore] Game stats updated:', statsData);
    
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
