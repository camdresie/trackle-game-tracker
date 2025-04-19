import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getTodayInEasternTime, isToday } from '@/utils/dateUtils';

// Constants to control pagination and memory usage
const PAGE_SIZE = 50; // Reduced from 100 to 50 for faster initial load
const MAX_RECORDS = 500; // Reduced from 1000 to 500 for better performance
const CACHE_EXPIRY = 60 * 1000; // 1 minute cache expiry (was 5 minutes)

/**
 * Hook for fetching ALL scores data across users with pagination to reduce memory usage
 */
export const useScoresData = (userId: string | undefined, selectedGame: string) => {
  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['all-scores', selectedGame],
    queryFn: async () => {
      try {
        
        // Create base query
        let query = supabase.from('scores').select('*');
        
        // Filter by selected game if not 'all'
        if (selectedGame && selectedGame !== 'all') {
          query = query.eq('game_id', selectedGame);
        }
        
        // Create a map to store profiles by ID for quick lookup
        const profilesMap = new Map();
        
        // Fetch data with pagination to reduce memory usage
        let allScores = [];
        let page = 0;
        let hasMore = true;
        
        // Fetch data page by page until we have all records or hit the maximum
        while (hasMore && allScores.length < MAX_RECORDS) {
          const { data: pageData, error: pageError } = await query
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .order('created_at', { ascending: false });
            
          if (pageError) throw pageError;
          
          if (!pageData || pageData.length === 0) {
            hasMore = false;
          } else {
            // Only add new records to avoid duplicates
            allScores = [...allScores, ...pageData];
            page++;
            
            // Check if we got fewer records than PAGE_SIZE, which means we've reached the end
            if (pageData.length < PAGE_SIZE) {
              hasMore = false;
            }
          }
          
          // Break if we've reached the maximum allowed records
          if (allScores.length >= MAX_RECORDS) {
            hasMore = false;
          }
        }
        
        
        // If we have scores, fetch the matching profiles
        if (allScores.length > 0) {
          // Get unique user IDs from scores - use Set for faster deduplication
          const userIdSet = new Set(allScores.map(score => score.user_id));
          const userIds = Array.from(userIdSet);
          
          // Batch profile fetching to avoid large IN clauses
          const BATCH_SIZE = 50; // Reduced from 100 to 50
          for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batchIds = userIds.slice(i, i + BATCH_SIZE);
            
            // Fetch profiles for this batch of users
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url') // Only select needed fields
              .in('id', batchIds);
              
            if (profilesError) {
              console.error('Error fetching profiles batch:', profilesError);
              continue; // Continue with the next batch even if this one fails
            }
            
            // Add profiles to the map
            profilesData?.forEach(profile => {
              profilesMap.set(profile.id, profile);
            });
          }
          
          
          // Get today's date in Eastern Time for consistent comparison
          const today = getTodayInEasternTime();
          
          // Process each score, removing duplicates by user/game/date
          // This ensures modified scores don't appear as duplicates
          const uniqueScoreMap = new Map();
          
          // Process scores knowing they're already sorted by created_at (newest first)
          allScores.forEach(item => {
            const scoreKey = `${item.user_id}-${item.game_id}-${item.date}`;
            
            // Only add if we haven't seen this key yet (first one is the newest due to sorting)
            if (!uniqueScoreMap.has(scoreKey)) {
              uniqueScoreMap.set(scoreKey, item);
            }
          });
          
          // Convert map back to array of unique scores
          const uniqueScores = Array.from(uniqueScoreMap.values());
          
          // Transform and combine the data - using for loop instead of map for better performance
          const transformedData = [];
          for (let i = 0; i < uniqueScores.length; i++) {
            const item = uniqueScores[i];
            // Use the isToday function to check if the score's date matches today's date
            const scoreIsToday = isToday(item.date);
            
            // Get the matching profile
            const profile = profilesMap.get(item.user_id);
            
            transformedData.push({
              ...item,
              isToday: scoreIsToday,
              formattedDate: item.date,
              profiles: profile || null
            });
          }
          
          // Count and log today's scores
          const todayScoresCount = transformedData.filter(item => item.isToday).length;
          
          return transformedData;
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching scores data:', error);
        toast.error('Failed to load score data');
        return [];
      }
    },
    staleTime: CACHE_EXPIRY, // Cache data for 1 minute to reduce API calls
    enabled: true // Always fetch all scores data regardless of user ID
  });

  return { scoresData, isLoadingScores };
};
