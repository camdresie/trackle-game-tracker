import { supabase } from '@/lib/supabase';
import { Score } from '@/utils/types';

/**
 * Get scores for a specific game and user
 */
export const getGameScores = async (gameId: string, userId: string): Promise<Score[]> => {
  try {
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
    
    // Process scores to deduplicate by date (keeping the most recent version)
    const uniqueScoresByDate = new Map();
    
    // Sort by created_at descending so newer scores come first
    const sortedData = [...data].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Add only the first (newest) score for each date
    sortedData.forEach(score => {
      const dateKey = score.date;
      if (!uniqueScoresByDate.has(dateKey)) {
        uniqueScoresByDate.set(dateKey, score);
      }
    });
    
    // Convert map back to array
    const uniqueScores = Array.from(uniqueScoresByDate.values());
    
    // Transform the data to match our Score type
    const scores = uniqueScores.map(score => ({
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
 * Check if a user already has a score for a specific game on a specific date
 */
export const checkExistingScore = async (
  gameId: string, 
  userId: string, 
  date: string
): Promise<Score | null> => {
  try {
    // Query all scores for this game, user, and date ordered by creation time (newest first)
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('[checkExistingScore] Error checking for existing score:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Take the most recently created score
    const latestScore = data[0];
    
    return {
      id: latestScore.id,
      gameId: latestScore.game_id,
      playerId: latestScore.user_id,
      value: latestScore.value,
      date: latestScore.date,
      notes: latestScore.notes || '',
      createdAt: latestScore.created_at
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
    // First check if a score already exists for this date if not in update mode
    if (!isUpdate) {
      const existingScore = await checkExistingScore(
        scoreData.gameId,
        scoreData.playerId,
        scoreData.date
      );
      
      if (existingScore) {
        // Switch to update mode and use the existing score ID
        isUpdate = true;
        scoreData.id = existingScore.id;
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
      
      // The auto-adding to selected_games functionality has been removed
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

/**
 * Delete a score for a specific game
 */
export const deleteGameScore = async (scoreId: string): Promise<boolean> => {
  try {
    // Get the score data before deleting (for stats update)
    const { data: scoreData, error: fetchError } = await supabase
      .from('scores')
      .select('*')
      .eq('id', scoreId)
      .single();
      
    if (fetchError) {
      console.error('[deleteGameScore] Error fetching score before deletion:', fetchError);
      throw fetchError;
    }
    
    // Get the latest scores to recalculate stats (excluding the one we're deleting)
    const { data: latestScores, error: latestError } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', scoreData.game_id)
      .eq('user_id', scoreData.user_id)
      .neq('id', scoreId)
      .order('date', { ascending: false });
      
    if (latestError) {
      console.error('[deleteGameScore] Error fetching other scores:', latestError);
    }
    
    // Now delete the score
    const { error: deleteError } = await supabase
      .from('scores')
      .delete()
      .eq('id', scoreId);
      
    if (deleteError) {
      console.error('[deleteGameScore] Error deleting score:', deleteError);
      throw deleteError;
    }
    
    // Recalculate user stats for this game
    const latestScore = latestScores && latestScores.length > 0 ? latestScores[0] : null;
    
    const { error: statsError } = await supabase
      .rpc('recalculate_user_game_stats', {
        p_user_id: scoreData.user_id,
        p_game_id: scoreData.game_id
      });
      
    if (statsError) {
      console.error('[deleteGameScore] Error recalculating game stats:', statsError);
      // Still return true since the score was deleted
    }
    
    return true;
  } catch (error) {
    console.error('[deleteGameScore] Exception in deleteGameScore:', error);
    return false;
  }
};

/**
 * Get best score for a user and game
 */
export const getBestScore = async (gameId: string, userId: string): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_best_score', {
        p_game_id: gameId,
        p_user_id: userId
      });
      
    if (error) {
      console.error('[getBestScore] Error getting best score:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[getBestScore] Exception in getBestScore:', error);
    return null;
  }
};

// Get the latest score for a user and game
export const getLatestScore = async (gameId: string, userId: string): Promise<Score | null> => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('[getLatestScore] Error getting latest score:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const score = data[0];
    return {
      id: score.id,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes || '',
      createdAt: score.created_at
    };
  } catch (error) {
    console.error('[getLatestScore] Exception in getLatestScore:', error);
    return null;
  }
};
