
import { supabase } from '@/lib/supabase';
import { Score } from '@/utils/types';
import { format } from 'date-fns';

/**
 * Get today's games for a user
 */
export const getTodaysGames = async (userId: string): Promise<Score[]> => {
  try {
    // Get today's date in YYYY-MM-DD format using local timezone
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log(`[getTodaysGames] Fetching games for user ${userId} on ${today}`);
    
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .gte('date', today) // Use greater than or equal to get today's date
      .lte('date', today); // Use less than or equal to get today's date
      
    if (error) {
      console.error('[getTodaysGames] Error fetching today\'s games:', error);
      throw error;
    }
    
    console.log(`[getTodaysGames] Raw data from Supabase:`, data);
    
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
