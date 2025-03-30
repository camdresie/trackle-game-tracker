import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getTodayInEasternTime, isToday } from '@/utils/dateUtils';

// Constants to control pagination and memory usage
const PAGE_SIZE = 100; // Number of records to fetch per page
const MAX_RECORDS = 1000; // Maximum number of records to load in total to prevent memory issues

/**
 * Hook for fetching ALL scores data across users with pagination to reduce memory usage
 */
export const useScoresData = (userId: string | undefined, selectedGame: string) => {
  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['all-scores', selectedGame],
    queryFn: async () => {
      try {
        console.log('Fetching scores data with pagination for game:', selectedGame);
        
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
            allScores = [...allScores, ...pageData];
            page++;
            
            // Check if we got fewer records than PAGE_SIZE, which means we've reached the end
            if (pageData.length < PAGE_SIZE) {
              hasMore = false;
            }
          }
          
          // Break if we've reached the maximum allowed records
          if (allScores.length >= MAX_RECORDS) {
            console.log(`Reached maximum record limit (${MAX_RECORDS}), stopping pagination`);
            hasMore = false;
          }
        }
        
        console.log('Retrieved scores data:', allScores.length, 'records');
        
        // If we have scores, fetch the matching profiles
        if (allScores.length > 0) {
          // Get unique user IDs from scores
          const userIds = [...new Set(allScores.map(score => score.user_id))];
          
          // Batch profile fetching to avoid large IN clauses
          const BATCH_SIZE = 100; // Maximum number of IDs to include in a single query
          for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batchIds = userIds.slice(i, i + BATCH_SIZE);
            
            // Fetch profiles for this batch of users
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('*')
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
          
          console.log('Retrieved profiles data for scores:', profilesMap.size);
          
          // Get today's date in Eastern Time for consistent comparison
          const today = getTodayInEasternTime();
          console.log('Today\'s date (ET/YYYY-MM-DD) for comparison:', today);
          
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
          console.log('Unique scores after deduplication:', uniqueScores.length);
          
          // Transform and combine the data
          const transformedData = uniqueScores.map(item => {
            // Use the isToday function to check if the score's date matches today's date
            const scoreIsToday = isToday(item.date);
            
            // Get the matching profile
            const profile = profilesMap.get(item.user_id);
            
            return {
              ...item,
              isToday: scoreIsToday,
              formattedDate: item.date,
              profiles: profile || null
            };
          });
          
          // Count and log today's scores
          const todayScoresCount = transformedData.filter(item => item.isToday).length;
          console.log(`Total scores marked as today: ${todayScoresCount}`);
          
          return transformedData;
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching scores data:', error);
        toast.error('Failed to load score data');
        return [];
      }
    },
    enabled: true // Always fetch all scores data regardless of user ID
  });

  return { scoresData, isLoadingScores };
};
