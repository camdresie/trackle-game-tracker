
import { supabase } from '@/lib/supabase';
import { Score } from '@/utils/types';
import { getTodayInEasternTime } from '@/utils/dateUtils';

/**
 * Get today's games for a user
 */
export const getTodaysGames = async (userId: string): Promise<Score[]> => {
  try {
    // Get today's date in YYYY-MM-DD format using Eastern Time for consistency
    const today = getTodayInEasternTime();
    
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);
      
    if (error) {
      console.error('Error fetching today\'s games:', error);
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
    console.error('Exception in getTodaysGames:', error);
    throw error;
  }
};

/**
 * Get today's games for all users (to get friend scores)
 * 
 * This function now fetches ALL scores for today regardless of the user
 * so that we can still see scores from users who were added as friends after they played
 */
export const getTodaysGamesForAllUsers = async (gameId: string | null): Promise<Score[]> => {
  try {
    // Get today's date in YYYY-MM-DD format using Eastern Time for consistency
    const today = getTodayInEasternTime();
    
    // Skip query if no gameId is provided
    if (!gameId) return [];
    
    console.log(`Fetching today's scores for all users for game: ${gameId}, date: ${today}`);
    
    // Modified query to fetch ALL scores for today for the specified game
    // This ensures we get scores from users who become friends after they played
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('date', today);
      
    if (error) {
      console.error('Error fetching today\'s games for all users:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} today's scores for all users`);
    
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
    console.error('Exception in getTodaysGamesForAllUsers:', error);
    throw error;
  }
};
