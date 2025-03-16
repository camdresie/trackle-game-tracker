import { supabase } from '@/lib/supabase';
import { Game, Score, GameStats } from '@/utils/types';

export async function addGameScore(score: Omit<Score, 'id'>) {
  try {
    console.log('Adding game score:', score);
    
    const { data, error } = await supabase.rpc('update_game_stats', {
      p_user_id: score.playerId,
      p_game_id: score.gameId,
      p_score: score.value,
      p_date: score.date
    });

    if (error) {
      console.error('Error adding game score:', error);
      throw error;
    }

    // Also insert the actual score record
    const { data: scoreData, error: scoreError } = await supabase
      .from('scores')
      .insert({
        game_id: score.gameId,
        user_id: score.playerId,
        value: score.value,
        date: score.date,
        notes: score.notes
      })
      .select()
      .single();

    if (scoreError) {
      console.error('Error saving score record:', scoreError);
      throw scoreError;
    }

    console.log('Game stats updated:', data);
    return { stats: data, score: scoreData };
  } catch (error) {
    console.error('Error in addGameScore:', error);
    throw error;
  }
}

export async function getUserGameStats(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_user_game_stats', {
      user_id_param: userId
    });

    if (error) {
      console.error('Error getting user game stats:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserGameStats:', error);
    throw error;
  }
}

export async function getPlayedGames(userId: string) {
  try {
    const { data, error } = await supabase
      .from('game_stats')
      .select('game_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting played games:', error);
      throw error;
    }

    return data.map(item => item.game_id);
  } catch (error) {
    console.error('Error in getPlayedGames:', error);
    throw error;
  }
}

export async function getTodaysGames(userId: string) {
  try {
    // Get today's date in YYYY-MM-DD format without timezone conversion
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    console.log('Fetching games for today (from service):', today);
    
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting today\'s games:', error);
      throw error;
    }

    console.log('Today\'s games data from service:', data);
    
    // Transform to match our Score type
    const scores = data.map(score => ({
      id: score.id,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes
    }));
    
    console.log('Transformed scores:', scores);
    return scores;
  } catch (error) {
    console.error('Error in getTodaysGames:', error);
    throw error;
  }
}

export async function getGameScores(gameId: string, userId: string) {
  try {
    console.log(`[getGameScores] Fetching scores for game:${gameId}, user:${userId}`);
    
    // Perform the actual query without checking count first
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

    console.log(`[getGameScores] Successfully retrieved ${data?.length || 0} scores for game ${gameId} and user ${userId}:`, data);
    
    if (!data || data.length === 0) {
      console.log(`[getGameScores] No scores found for game ${gameId} and user ${userId}`);
      return [];
    }

    // Transform data consistently while ensuring all fields are present
    const formattedScores = data.map(score => ({
      id: score.id || `temp-${Date.now()}`,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes || '',
      createdAt: score.created_at || new Date().toISOString()
    }));
    
    console.log(`[getGameScores] Transformed ${formattedScores.length} scores:`, formattedScores);
    return formattedScores;
  } catch (error) {
    console.error('[getGameScores] Unhandled error:', error);
    throw error;
  }
}

// Updated function to add test scores for friends using RPC function
export async function addFriendTestScores(gameId: string, friendId: string, currentUserId: string) {
  try {
    console.log(`[addFriendTestScores] Adding test scores for friend:${friendId}, game:${gameId}`);
    
    // Generate dates for the last 3 days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Format dates to YYYY-MM-DD
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    // Call our improved stored function to add test scores
    const { data, error } = await supabase.rpc('add_friend_test_scores', {
      p_game_id: gameId,
      p_friend_id: friendId,
      p_requester_id: currentUserId,
      p_today_date: formatDate(today),
      p_yesterday_date: formatDate(yesterday),
      p_two_days_ago_date: formatDate(twoDaysAgo)
    });
    
    if (error) {
      console.error('[addFriendTestScores] Error:', error);
      return { success: false, error };
    }
    
    console.log('[addFriendTestScores] Success response from RPC function:', data);
    
    // Check if the data has a success field and if it's false
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      console.warn('[addFriendTestScores] Function returned success: false', data);
      return { success: false, error: data.message || 'Unknown error from function' };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('[addFriendTestScores] Unexpected error:', error);
    return { success: false, error };
  }
}
