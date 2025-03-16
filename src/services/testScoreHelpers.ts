import { supabase } from '@/lib/supabase';
import { Score } from '@/utils/types';
import { format, subDays } from 'date-fns';

/**
 * Add test scores for a friend to help debug RLS and display issues
 */
export const addFriendTestScores = async (gameId: string, friendId: string, requesterId: string): Promise<{ success: boolean; error?: any; scores?: Score[] }> => {
  try {
    console.log(`Adding test scores for game ${gameId}, friend ${friendId}, requester ${requesterId}`);
    
    // Get today's date and format as YYYY-MM-DD
    const today = new Date();
    const todayFormatted = format(today, 'yyyy-MM-dd');
    const yesterdayFormatted = format(subDays(today, 1), 'yyyy-MM-dd');
    const twoDaysAgoFormatted = format(subDays(today, 2), 'yyyy-MM-dd');
    
    // Call our database function to add test scores with proper permissions
    const { data, error } = await supabase.rpc('add_friend_test_scores', {
      p_game_id: gameId,
      p_friend_id: friendId,
      p_requester_id: requesterId,
      p_today_date: todayFormatted,
      p_yesterday_date: yesterdayFormatted,
      p_two_days_ago_date: twoDaysAgoFormatted
    });
    
    if (error) {
      console.error('Error adding test scores:', error);
      return { success: false, error };
    }
    
    console.log('Test scores added successfully:', data);
    
    // Now directly check if we can fetch the scores we just added
    const { data: verifyScores, error: verifyError } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', friendId);
      
    if (verifyError) {
      console.error('Error verifying added scores:', verifyError);
      return { success: true, error: verifyError };
    }
    
    console.log('Verification of added scores:', verifyScores);
    
    // Format the scores for display
    const formattedScores = verifyScores?.map(score => ({
      id: score.id,
      gameId: score.game_id,
      playerId: score.user_id,
      value: score.value,
      date: score.date,
      notes: score.notes || '',
      createdAt: score.created_at
    })) || [];
    
    return { 
      success: true, 
      scores: formattedScores
    };
  } catch (error) {
    console.error('Exception in addFriendTestScores:', error);
    return { success: false, error };
  }
};
