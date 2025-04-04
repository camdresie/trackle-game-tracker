import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { Score } from '@/utils/types';
import { getTodaysGamesForAllUsers } from '@/services/todayService';
import { supabase } from '@/lib/supabase';

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

// Define interface for profile data
interface MemberProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role?: string;
}

// Define interface for group membership data
interface GroupMembershipData {
  groupId: string;
  memberIds: string[];
}

// Define interface for member list by group
interface GroupMembersData {
  groupId: string;
  members: MemberProfile[];
}

// Define interface for combined profile and membership data
interface MemberProfilesData {
  profiles: MemberProfile[];
  groupMembership: GroupMembershipData[];
  membersByGroup: GroupMembersData[];
  lastUpdated: number;
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
  const [memberProfilesData, setMemberProfilesData] = useState<MemberProfilesData>({ profiles: [], groupMembership: [], membersByGroup: [], lastUpdated: 0 });
  
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
  
  // Fetch profiles for all group members and creators - simplified approach
  useEffect(() => {
    if (!user || !memoizedFriendGroups.length) return;
    
    const fetchAllGroupMembers = async () => {
      try {
        console.log('Fetching all group members for groups:', memoizedFriendGroups.map(g => g.id).join(', '));
        
        // Get all group IDs the user is part of
        const groupIds = memoizedFriendGroups.map(g => g.id);
        
        if (groupIds.length === 0) return;
        
        // 1. First get all group members
        const { data: groupMembers, error: membersError } = await supabase
          .from('friend_group_members')
          .select('group_id, friend_id, status')
          .in('group_id', groupIds);
          
        if (membersError) {
          console.error('Error fetching group members:', membersError);
          return;
        }
        
        // Log all members with their status for debugging
        console.log('All group members with status:', groupMembers?.map(m => 
          `${m.friend_id} (${m.status}) in group ${m.group_id}`
        ));
        
        // 2. Then get all group creators (from groups table)
        const { data: groups, error: groupsError } = await supabase
          .from('friend_groups')
          .select('id, user_id')
          .in('id', groupIds);
          
        if (groupsError) {
          console.error('Error fetching group creators:', groupsError);
          return;
        }
        
        // 3. Combine all user IDs we need to fetch
        const userIds = new Set<string>();
        
        // Add members
        if (groupMembers) {
          groupMembers.forEach(member => {
            if (member.friend_id) {
              userIds.add(member.friend_id);
            }
          });
        }
        
        // Add creators
        if (groups) {
          groups.forEach(group => {
            if (group.user_id) {
              userIds.add(group.user_id);
            }
          });
        }
        
        // Remove current user - we don't need to fetch their profile
        if (user.id) {
          userIds.delete(user.id);
        }
        
        // Convert to array
        const userIdsArray = Array.from(userIds);
        
        if (userIdsArray.length === 0) return;
        
        // 4. Fetch profiles for all these user IDs
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIdsArray);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }
        
        // 5. Prepare the data structure
        const membersByGroup = new Map();
        
        // Initialize with empty arrays for each group
        groupIds.forEach(groupId => {
          membersByGroup.set(groupId, []);
        });
        
        // Process members and add them to the appropriate groups
        if (groupMembers && profiles) {
          groupMembers.forEach(member => {
            if (!member.friend_id || !member.group_id) return;
            
            const profile = profiles.find(p => p.id === member.friend_id);
            if (profile && membersByGroup.has(member.group_id)) {
              membersByGroup.get(member.group_id).push({
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                role: 'member',
                status: member.status || 'unknown'
              });
            }
          });
        }
        
        // Process creators and add them to the appropriate groups
        if (groups && profiles) {
          groups.forEach(group => {
            if (!group.user_id || !group.id) return;
            
            // Don't add if already added as a member
            const existingMembers = membersByGroup.get(group.id) || [];
            if (existingMembers.some(m => m.id === group.user_id)) return;
            
            const profile = profiles.find(p => p.id === group.user_id);
            if (profile && membersByGroup.has(group.id)) {
              membersByGroup.get(group.id).push({
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                role: 'creator',
                status: 'accepted'
              });
            }
          });
        }
        
        console.log('Processed group members:', Array.from(membersByGroup.entries()));
        
        // 6. Store the results
        setMemberProfilesData(prev => ({
          ...prev,
          membersByGroup: Array.from(membersByGroup.entries()).map(([groupId, members]) => ({
            groupId,
            members
          })),
          lastUpdated: Date.now()
        }));
        
      } catch (error) {
        console.error('Error in fetchAllGroupMembers:', error);
      }
    };
    
    fetchAllGroupMembers();
  }, [user, memoizedFriendGroups]);
  
  // Process group data more efficiently with the simplified approach
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
      
      // Get the membersByGroup data from our database query results
      const fetchedMembersByGroup = memberProfilesData.membersByGroup || [];
      
      // Create a lookup map for the fetched members
      const membersByGroupMap = new Map();
      fetchedMembersByGroup.forEach(item => {
        membersByGroupMap.set(item.groupId, item.members || []);
      });
      
      // Debug logs to check what we're working with
      console.log('Found groups:', memoizedFriendGroups.map(g => `${g.name} (${g.id})`));
      console.log('Fetched members by group:', fetchedMembersByGroup);
      
      // Simple approach to process groups
      const processedGroups = memoizedFriendGroups.map(group => {
        // Create a members array with just the current user for now
        const members: GroupMemberPerformance[] = [];
        const seenMemberIds = new Set<string>();
        
        // Always add the current user to their groups
        if (group.isJoinedGroup || group.user_id === user.id) {
          members.push({
            playerId: user.id,
            playerName: 'You',
            hasPlayed: userHasPlayed,
            score: userScore
          });
          
          seenMemberIds.add(user.id);
        }
        
        // Add known group members from the group object (these are friends)
        if (group.members && Array.isArray(group.members)) {
          group.members.forEach(member => {
            if (member.id === user.id || seenMemberIds.has(member.id)) return; // Skip duplicates
            
            // Find the member's score
            const memberScore = allTodaysScores.find(score => 
              score.gameId === memoizedGameId && score.playerId === member.id
            );
            
            const hasPlayed = !!memberScore;
            const score = hasPlayed ? memberScore.value : null;
            
            members.push({
              playerId: member.id,
              playerName: member.name,
              hasPlayed,
              score
            });
            
            seenMemberIds.add(member.id);
          });
        }
        
        // Add any additional members we fetched from database (including non-friends)
        const fetchedGroupMembers = membersByGroupMap.get(group.id) || [];
        if (fetchedGroupMembers.length > 0) {
          console.log(`Group ${group.name} has ${fetchedGroupMembers.length} fetched members`);
          
          fetchedGroupMembers.forEach(member => {
            // Skip if already added (don't add duplicates)
            if (seenMemberIds.has(member.id)) return;
            
            // Skip if member is not accepted and not the owner
            // This ensures we don't show pending members in the scores list
            if (member.role !== 'creator' && member.status && member.status !== 'accepted') {
              console.log(`Skipping non-accepted member ${member.id} with status ${member.status}`);
              return;
            }
            
            // Find the member's score
            const memberScore = allTodaysScores.find(score => 
              score.gameId === memoizedGameId && score.playerId === member.id
            );
            
            const hasPlayed = !!memberScore;
            const score = hasPlayed ? memberScore.value : null;
            
            members.push({
              playerId: member.id,
              playerName: member.full_name || member.username || 'Group Member',
              hasPlayed,
              score
            });
            
            seenMemberIds.add(member.id);
          });
        }
        
        // Log the final members list for debugging
        console.log(`Group ${group.name} final members (${members.length}):`, 
          members.map(m => m.playerName));
        
        return {
          groupId: group.id,
          groupName: group.name,
          currentUserHasPlayed: userHasPlayed,
          currentUserScore: userScore,
          members
        };
      });
      
      // Update state
      setGroupPerformanceData(processedGroups);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing group data:', error);
      setIsLoading(false);
    }
  }, [user?.id, memoizedGameId, allTodaysScores, memoizedTodaysScores, memoizedFriendGroups, memberProfilesData]);
  
  // Process all membership data when the hook is used
  /*
  useEffect(() => {
    // Force a refresh of group data
    const fetchData = async () => {
      if (!user || !memoizedFriendGroups.length) return;
      
      try {
        // Get all the group IDs
        const groupIds = memoizedFriendGroups.map(group => group.id);
        
        if (groupIds.length === 0) return;
        
        // Get all accepted members of these groups
        const { data: members, error } = await supabase
          .from('friend_group_members')
          .select('group_id, friend_id')
          .in('group_id', groupIds)
          .eq('status', 'accepted');
          
        if (error) {
          throw error;
        }
        
        console.log(`Found ${members?.length || 0} members across all groups`);
        
        // Force a refresh of data if needed
        if (firstLoadDone.current && memberProfilesData.profiles.length === 0) {
          // Force a re-fetch of today's scores
          if (fetchAllTodaysScoresRef.current) {
            await fetchAllTodaysScoresRef.current(true);
          }
        }
      } catch (error) {
        console.error('Error fetching group membership:', error);
      }
    };
    
    fetchData();
  }, [user, memoizedFriendGroups]);
  */
  
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
