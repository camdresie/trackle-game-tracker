
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
    const today = new Date().toISOString().split('T')[0];
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
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error getting game scores:', error);
      throw error;
    }

    // Transform to match our Score type
    return data.map(score => ({
      id: score.id,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes
    }));
  } catch (error) {
    console.error('Error in getGameScores:', error);
    throw error;
  }
}
