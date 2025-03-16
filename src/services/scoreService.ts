
import { supabase } from '@/lib/supabase';
import { Score } from '@/utils/types';

/**
 * Get scores for a specific game and user
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
