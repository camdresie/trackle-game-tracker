import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { Score } from '@/utils/types';
import { getTodaysGamesForAllUsers } from '@/services/todayService';

// Define a type for group member performance data
interface GroupMemberPerformance {
  playerId: string;
  playerName: string;
  hasPlayed: boolean;
  score: number | null;
}

// Define a type for the processed group performance data
interface GroupPerformance {
  groupId: string;
  groupName: string;
  currentUserHasPlayed: boolean;
  currentUserScore: number | null;
  members: GroupMemberPerformance[];
}

// Define a type for all friends' performance data
interface AllFriendsPerformance {
  members: GroupMemberPerformance[];
  currentUserHasPlayed: boolean;
  currentUserScore: number | null;
}

export const useGroupScores = (gameId: string | null, todaysScores: Score[]) => {
  const { user } = useAuth();
  const { friends, refreshFriends } = useFriendsList();
  const { friendGroups } = useFriendGroups(friends);
  const [isLoading, setIsLoading] = useState(true);
  const [groupPerformanceData, setGroupPerformanceData] = useState<GroupPerformance[]>([]);
  const [allTodaysScores, setAllTodaysScores] = useState<Score[]>([]);
  const [allFriendsData, setAllFriendsData] = useState<AllFriendsPerformance | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Debug friends list to see all connections
  useEffect(() => {
    console.log('useGroupScores - Friends:', friends.map(f => ({ id: f.id, name: f.name })));
  }, [friends]);
  
  // Fetch all today's scores for the selected game with improved memory handling
  useEffect(() => {
    // Create a flag to track if the component is still mounted
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchAllTodaysScores = async () => {
      if (!gameId) {
        if (isMounted) {
          setAllTodaysScores([]);
          setIsLoading(false);
        }
        return;
      }
      
      // Throttle API calls to reduce memory usage - only fetch every 30 seconds
      const now = Date.now();
      const FETCH_THROTTLE = 30000; // 30 seconds
      
      if (now - lastFetchTime < FETCH_THROTTLE && allTodaysScores.length > 0) {
        console.log(`Skipping fetch - last fetch was ${Math.round((now - lastFetchTime) / 1000)}s ago`);
        return;
      }
      
      try {
        if (isMounted) setIsLoading(true);
        console.log(`Fetching ALL today's scores for game ${gameId}`);
        
        const scores = await getTodaysGamesForAllUsers(gameId);
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log(`Got ${scores.length} today scores for all users`);
          setAllTodaysScores(scores);
          setLastFetchTime(Date.now());
          
          // Log the player IDs of the scores
          if (scores.length > 0) {
            const uniquePlayerIds = [...new Set(scores.map(s => s.playerId))];
            console.log(`Scores from ${uniquePlayerIds.length} unique players:`, uniquePlayerIds);
            
            // Log friend IDs to compare
            const friendIds = friends.map(f => f.id);
            console.log(`Current friend IDs (${friendIds.length}):`, friendIds);
            
            // Check overlap
            const friendScores = scores.filter(s => friendIds.includes(s.playerId));
            console.log(`Found ${friendScores.length} scores from friends`);
            
            // Log scores that are from friends (limit the logging to avoid spamming the console)
            const MAX_LOG_ENTRIES = 5;
            if (friendScores.length > 0) {
              console.log(`Showing first ${Math.min(MAX_LOG_ENTRIES, friendScores.length)} friend scores:`);
              friendScores.slice(0, MAX_LOG_ENTRIES).forEach(score => {
                const friend = friends.find(f => f.id === score.playerId);
                console.log(`Friend score: ${friend?.name} (${score.playerId}), value: ${score.value}`);
              });
              
              if (friendScores.length > MAX_LOG_ENTRIES) {
                console.log(`... and ${friendScores.length - MAX_LOG_ENTRIES} more`);
              }
            }
            
            // Log scores that are not from friends
            const nonFriendScores = scores.filter(s => !friendIds.includes(s.playerId) && s.playerId !== user?.id);
            if (nonFriendScores.length > 0) {
              console.log(`Found ${nonFriendScores.length} scores from non-friends`);
              console.log(`Showing first ${Math.min(MAX_LOG_ENTRIES, nonFriendScores.length)} non-friend scores:`);
              nonFriendScores.slice(0, MAX_LOG_ENTRIES).forEach(score => {
                console.log(`Non-friend score: ${score.playerId}, value: ${score.value}`);
              });
              
              if (nonFriendScores.length > MAX_LOG_ENTRIES) {
                console.log(`... and ${nonFriendScores.length - MAX_LOG_ENTRIES} more`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching all today\'s scores:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchAllTodaysScores();
    
    // Return cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [gameId, friends, user?.id, lastFetchTime, allTodaysScores.length]);
  
  // Memoize processing of friend data to reduce unnecessary recalculations
  const processedFriendData = useMemo(() => {
    if (!user || !gameId || !allTodaysScores.length) {
      return null;
    }
    
    try {
      // Get today's score for the current user from their own scores
      const userTodayScore = todaysScores.find(score => 
        score.gameId === gameId && score.playerId === user.id
      );
      
      const userHasPlayed = !!userTodayScore;
      const userScore = userHasPlayed ? userTodayScore.value : null;
      
      // Process all friends' performance data regardless of group membership
      const allFriendsMembers: GroupMemberPerformance[] = friends.map(friend => {
        // Look for each friend's score in allTodaysScores
        const friendScore = allTodaysScores.find(score => 
          score.playerId === friend.id && score.gameId === gameId
        );
        
        const hasPlayed = !!friendScore;
        const score = hasPlayed ? friendScore.value : null;
        
        return {
          playerId: friend.id,
          playerName: friend.name,
          hasPlayed: hasPlayed,
          score: score
        };
      });
      
      return {
        members: allFriendsMembers,
        currentUserHasPlayed: userHasPlayed,
        currentUserScore: userScore
      };
    } catch (error) {
      console.error('Error processing friend data:', error);
      return null;
    }
  }, [user, gameId, allTodaysScores, todaysScores, friends]);
  
  // Update all friends data when processed data changes
  useEffect(() => {
    if (processedFriendData) {
      setAllFriendsData(processedFriendData);
    }
  }, [processedFriendData]);
  
  // Process group data more efficiently
  useEffect(() => {
    // Create a flag to track if the component is still mounted
    let isMounted = true;
    
    const processGroupData = () => {
      if (!user || !gameId) {
        if (isMounted) {
          setGroupPerformanceData([]);
          setIsLoading(false);
        }
        return;
      }
      
      try {
        console.log(`Processing group data with ${allTodaysScores.length} today scores`);
        
        // Get today's score for the current user from their own scores
        const userTodayScore = todaysScores.find(score => 
          score.gameId === gameId && score.playerId === user.id
        );
        
        const userHasPlayed = !!userTodayScore;
        const userScore = userHasPlayed ? userTodayScore.value : null;
        console.log(`Current user has played: ${userHasPlayed}, score: ${userScore}`);
        
        // Even if the user has no groups/friends, we should return an empty array
        // but with the current user's data for the "All Friends" view
        if (friendGroups.length === 0) {
          // If no groups exist, still include user data
          if (isMounted) {
            setGroupPerformanceData([{
              groupId: 'default',
              groupName: 'All Friends',
              currentUserHasPlayed: userHasPlayed,
              currentUserScore: userScore,
              members: [] // No friends yet
            }]);
            setIsLoading(false);
          }
          return;
        }
        
        // Process friend groups
        const processedGroups = friendGroups.map(group => {
          // Get today's scores for each member of the group
          const members = group.members?.map(member => {
            // Look in allTodaysScores for this friend's score
            const memberTodayScore = allTodaysScores.find(score =>
              score.gameId === gameId && score.playerId === member.id
            );
            
            const hasPlayed = !!memberTodayScore;
            const score = hasPlayed ? memberTodayScore.value : null;
            
            return {
              playerId: member.id,
              playerName: member.name,
              hasPlayed: hasPlayed,
              score: score
            };
          }) || [];
          
          return {
            groupId: group.id,
            groupName: group.name,
            currentUserHasPlayed: userHasPlayed,
            currentUserScore: userScore,
            members: members
          };
        });
        
        if (isMounted) {
          setGroupPerformanceData(processedGroups);
        }
      } catch (error) {
        console.error('Error processing group performance data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    processGroupData();
    
    // Return cleanup function
    return () => {
      isMounted = false;
    };
  }, [user, gameId, todaysScores, friends, friendGroups, allTodaysScores]);
  
  // Define the refresh function
  const handleRefreshFriends = async () => {
    try {
      setIsLoading(true);
      // Force a new fetch by updating the last fetch time
      setLastFetchTime(0);
      
      // Then call the normal refresh function
      if (refreshFriends) {
        await refreshFriends();
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing friends data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    isLoading, 
    groupPerformanceData, 
    allFriendsData, 
    refreshFriends: handleRefreshFriends 
  };
};
