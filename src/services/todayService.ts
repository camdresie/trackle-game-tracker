import { supabase } from '@/lib/supabase';
import { Score } from '@/utils/types';
import { getTodayInEasternTime } from '@/utils/dateUtils';

// Cache structure for storing scores to reduce database calls
interface ScoreCache {
  scores: Score[];
  timestamp: number;
}

// Cache for storing scores with TTL
const scoreCache: Map<string, ScoreCache> = new Map();
const CACHE_TTL = 60000; // 1 minute cache lifetime in milliseconds

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
 * 
 * Optimized with caching to reduce database calls and memory usage
 */
export const getTodaysGamesForAllUsers = async (gameId: string | null, forceRefresh = false): Promise<Score[]> => {
  try {
    // Skip query if no gameId is provided
    if (!gameId) return [];
    
    // Get today's date in YYYY-MM-DD format using Eastern Time for consistency
    const today = getTodayInEasternTime();
    
    // Create a cache key based on gameId and date
    const cacheKey = `scores_${gameId}_${today}`;
    
    // Check if we have valid cached data and aren't forcing a refresh
    const cachedData = scoreCache.get(cacheKey);
    if (!forceRefresh && cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      console.log(`Using cached data for game ${gameId} (${cachedData.scores.length} scores)`);
      return cachedData.scores;
    }
    
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
    
    // Store results in cache
    scoreCache.set(cacheKey, {
      scores: scores,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries to prevent memory leaks
    cleanupCache();
    
    return scores;
  } catch (error) {
    console.error('Exception in getTodaysGamesForAllUsers:', error);
    throw error;
  }
};

/**
 * Helper function to clean up expired cache entries
 * This prevents memory leaks from accumulating old cache data
 */
function cleanupCache() {
  const now = Date.now();
  
  // Delete expired cache entries
  for (const [key, value] of scoreCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      scoreCache.delete(key);
    }
  }
  
  // If cache is still too large, remove oldest entries
  const MAX_CACHE_SIZE = 20;
  if (scoreCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(scoreCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries until we're back to MAX_CACHE_SIZE
    for (let i = 0; i < entries.length - MAX_CACHE_SIZE; i++) {
      scoreCache.delete(entries[i][0]);
    }
  }
}
