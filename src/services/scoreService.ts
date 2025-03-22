
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
 * Check if a user already has a score for a specific game on a specific date
 */
export const checkExistingScore = async (
  gameId: string, 
  userId: string, 
  date: string
): Promise<Score | null> => {
  try {
    console.log(`[checkExistingScore] Checking for existing score: game=${gameId}, user=${userId}, date=${date}`);
    
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .eq('date', date)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log(`[checkExistingScore] No existing score found`);
        return null;
      }
      console.error('[checkExistingScore] Error checking for existing score:', error);
      throw error;
    }
    
    console.log(`[checkExistingScore] Found existing score:`, data);
    
    return {
      id: data.id,
      gameId: data.game_id,
      playerId: data.user_id,
      value: data.value,
      date: data.date,
      notes: data.notes || '',
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('[checkExistingScore] Exception in checkExistingScore:', error);
    // Return null instead of throwing to handle this gracefully
    return null;
  }
};

/**
 * Add a new score for a game or update an existing one
 */
export const addGameScore = async (
  scoreData: {
    id?: string;
    gameId: string;
    playerId: string;
    value: number;
    date: string;
    notes?: string;
    createdAt: string;
  }, 
  isUpdate: boolean = false
): Promise<{ stats: any; score: Score }> => {
  try {
    console.log(`[addGameScore] ${isUpdate ? 'Updating' : 'Adding'} score:`, scoreData);
    
    // First check if a score already exists for this date if not in update mode
    if (!isUpdate) {
      const existingScore = await checkExistingScore(
        scoreData.gameId,
        scoreData.playerId,
        scoreData.date
      );
      
      if (existingScore) {
        throw new Error('You already have a score for this game today. Please edit the existing score instead.');
      }
    }
    
    let result;
    
    if (isUpdate && scoreData.id) {
      // Update existing score
      const { data, error } = await supabase
        .from('scores')
        .update({
          value: scoreData.value,
          notes: scoreData.notes || null
          // Don't update date - users can only edit their score for the current day
        })
        .eq('id', scoreData.id)
        .select('*')
        .single();
        
      if (error) {
        console.error('[addGameScore] Error updating score:', error);
        throw error;
      }
      
      result = data;
      console.log('[addGameScore] Score updated successfully:', data);
    } else {
      // Insert new score
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
      
      result = data;
      console.log('[addGameScore] Score added successfully:', data);
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
    
    console.log('[addGameScore] Game stats updated:', statsData);
    
    // Format the response
    const scoreObj: Score = {
      id: result.id,
      gameId: result.game_id,
      playerId: result.user_id,
      value: result.value,
      date: result.date,
      notes: result.notes || '',
      createdAt: result.created_at
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
