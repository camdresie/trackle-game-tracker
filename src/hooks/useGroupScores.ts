import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  
  // Use ref to track if this is the first render
  const isFirstRender = useRef(true);
  const firstLoadDone = useRef(false);
  
  // Store previous values to compare and avoid unnecessary updates
  const prevGameId = useRef<string | null>(null);
  const prevAllTodaysScores = useRef<Score[]>([]);
  
  // Create a fetchAllTodaysScores ref to use in callbacks
  const fetchAllTodaysScoresRef = useRef<(forceRefresh?: boolean) => Promise<void>>();
  
  // Memoize the gameId to avoid triggering effects unnecessarily
  const memoizedGameId = useMemo(() => gameId, [gameId]);
  
  // Memoize friends and friendGroups to prevent unnecessary re-renders
  const memoizedFriends = useMemo(() => friends, [friends.length]);
  const memoizedFriendGroups = useMemo(() => friendGroups, [
    friendGroups.length,
    // Use a stable way to check for deep changes in friendGroups
    JSON.stringify(friendGroups.map(g => g.id))
  ]);
  
  // Memoize todaysScores to prevent unnecessary re-renders
  const memoizedTodaysScores = useMemo(() => todaysScores, [
    todaysScores.length,
    // Use a stable way to check for deep changes in todaysScores
    JSON.stringify(todaysScores.map(s => s.id))
  ]);
  
  // Fetch all today's scores for the selected game with improved memory handling
  useEffect(() => {
    // Skip the first render to prevent double-fetching
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Skip if the gameId hasn't changed or is null
    if (memoizedGameId === prevGameId.current && firstLoadDone.current) {
      return;
    }
    
    prevGameId.current = memoizedGameId;
    
    if (!memoizedGameId) {
      setAllTodaysScores([]);
      setIsLoading(false);
      return;
    }
    
    // Create a flag to track if the component is still mounted
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchAllTodaysScores = async (forceRefresh = false) => {
      // Throttle API calls to reduce memory usage - only fetch every 30 seconds
      const now = Date.now();
      const FETCH_THROTTLE = 30000; // 30 seconds
      
      // Always fetch on first load, when gameId changes, or when force refresh is requested
      if (!forceRefresh && now - lastFetchTime < FETCH_THROTTLE && allTodaysScores.length > 0 && firstLoadDone.current && memoizedGameId === prevGameId.current) {
        return;
      }
      
      try {
        setIsLoading(true);
        
        const scores = await getTodaysGamesForAllUsers(memoizedGameId, forceRefresh);
        
        // Skip update if data is the same and not forcing a refresh
        if (!forceRefresh && JSON.stringify(scores) === JSON.stringify(prevAllTodaysScores.current) && firstLoadDone.current && memoizedGameId === prevGameId.current) {
          setIsLoading(false);
          return;
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          prevAllTodaysScores.current = scores;
          setAllTodaysScores(scores);
          setLastFetchTime(now);
          firstLoadDone.current = true;
        }
      } catch (error) {
        console.error('Error fetching all today\'s scores:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Store the fetch function in the ref so it can be used in handleRefreshFriends
    fetchAllTodaysScoresRef.current = fetchAllTodaysScores;
    
    fetchAllTodaysScores();
    
    // Return cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [memoizedGameId, lastFetchTime]); // Keep minimal dependencies
  
  // Process friend data when related data changes
  const processedFriendData = useMemo(() => {
    if (!user || !memoizedGameId || !allTodaysScores.length) {
      return null;
    }
    
    try {
      // Get today's score for the current user from their own scores
      const userTodayScore = memoizedTodaysScores.find(score => 
        score.gameId === memoizedGameId && score.playerId === user.id
      );
      
      const userHasPlayed = !!userTodayScore;
      const userScore = userHasPlayed ? userTodayScore.value : null;
      
      // Process all friends' performance data regardless of group membership
      const allFriendsMembers: GroupMemberPerformance[] = memoizedFriends.map(friend => {
        // Look for each friend's score in allTodaysScores
        const friendScore = allTodaysScores.find(score => 
          score.playerId === friend.id && score.gameId === memoizedGameId
        );
        
        const hasPlayed = !!friendScore;
        // Only set score if hasPlayed is true, otherwise null
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
  }, [user?.id, memoizedGameId, allTodaysScores, memoizedTodaysScores, memoizedFriends]);
  
  // Update all friends data only when processed data actually changes
  useEffect(() => {
    if (processedFriendData && JSON.stringify(processedFriendData) !== JSON.stringify(allFriendsData)) {
      setAllFriendsData(processedFriendData);
    }
  }, [processedFriendData]);
  
  // Process group data more efficiently
  useEffect(() => {
    if (!user || !memoizedGameId) {
      setGroupPerformanceData([]);
      setIsLoading(false);
      return;
    }
    
    try {
      // Get today's score for the current user from their own scores
      const userTodayScore = memoizedTodaysScores.find(score => 
        score.gameId === memoizedGameId && score.playerId === user.id
      );
      
      const userHasPlayed = !!userTodayScore;
      const userScore = userHasPlayed ? userTodayScore.value : null;
      
      // Even if the user has no groups/friends, we should return an empty array
      // but with the current user's data for the "All Friends" view
      if (memoizedFriendGroups.length === 0) {
        // If no groups exist, still include user data
        setGroupPerformanceData([{
          groupId: 'default',
          groupName: 'All Friends',
          currentUserHasPlayed: userHasPlayed,
          currentUserScore: userScore,
          members: [] // No friends yet
        }]);
        setIsLoading(false);
        return;
      }
      
      // Process friend groups
      const processedGroups = memoizedFriendGroups.map(group => {
        // Get today's scores for each member of the group
        const members = group.members?.map(member => {
          // Look in allTodaysScores for this friend's score
          const memberTodayScore = allTodaysScores.find(score =>
            score.gameId === memoizedGameId && score.playerId === member.id
          );
          
          const hasPlayed = !!memberTodayScore;
          // Only set score if hasPlayed is true, otherwise null
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
      
      // Only update state if the data has actually changed
      setGroupPerformanceData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(processedGroups)) {
          return processedGroups;
        }
        return prev;
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing group data:', error);
      setIsLoading(false);
    }
  }, [user?.id, memoizedGameId, allTodaysScores, memoizedTodaysScores, memoizedFriendGroups]);
  
  const handleRefreshFriends = useCallback(async () => {
    try {
      await refreshFriends();
      
      // Force a re-fetch of today's scores with forceRefresh=true
      if (fetchAllTodaysScoresRef.current) {
        await fetchAllTodaysScoresRef.current(true);
      }
      
      // Also reset the firstLoadDone flag to force a fresh load
      firstLoadDone.current = false;
      
      return true;
    } catch (error) {
      console.error('Error refreshing friends:', error);
      return false;
    }
  }, [refreshFriends]);
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({ 
    isLoading, 
    groupPerformanceData, 
    allFriendsData,
    refreshFriends: handleRefreshFriends 
  }), [
    isLoading, 
    groupPerformanceData, 
    allFriendsData,
    handleRefreshFriends
  ]);
};
