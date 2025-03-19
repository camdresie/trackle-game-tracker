
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
