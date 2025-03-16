
import { supabase } from '@/lib/supabase';
import { Score } from '@/utils/types';

// Get scores for a specific game and user
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
      console.error('[getGameScores] Error fetching scores:', error);
      throw error;
    }
    
    console.log(`[getGameScores] Found ${data?.length || 0} scores for game ${gameId} and user ${userId}`);
    console.log('[getGameScores] Raw scores data:', data);
    
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
    
    console.log(`[getGameScores] Successfully retrieved ${scores.length} scores:`, scores);
    
    return scores;
  } catch (error) {
    console.error('[getGameScores] Exception in getGameScores:', error);
    throw error;
  }
};

// These functions are moved to testScoreHelpers.ts
export { addFriendTestScores } from './testScoreHelpers';
