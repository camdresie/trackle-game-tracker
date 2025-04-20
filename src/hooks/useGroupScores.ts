import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { Score } from '@/utils/types';
import { getTodaysGamesForAllUsers } from '@/services/todayService';
import { supabase } from '@/lib/supabase';
import { isDevelopment } from '@/utils/environment';

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
  // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Hook rendered. gameId: ${gameId}`);
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
        // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Fetched scores for gameId ${memoizedGameId}:`, JSON.stringify(scores));
        
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
        
        // 4. Fetch profiles for all these user IDs (excluding current user initially)
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
            // Ensure member exists in the map before adding
            if (profile && membersByGroup.has(member.group_id)) {
              // Check if this member ID is already added to this group to prevent duplicates
              const existingMembers = membersByGroup.get(member.group_id) || [];
              if (!existingMembers.some(m => m.id === profile.id)) { 
                membersByGroup.get(member.group_id).push({
                  id: profile.id,
                  username: profile.username,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url,
                  role: 'member',
                  status: member.status || 'unknown'
                });
              }
            }
          });
        }
        
        // Process creators and add them to the appropriate groups
        if (groups && profiles) {
          groups.forEach(group => {
            if (!group.user_id || !group.id) return;
            
            // Check if creator ID is already added to this group (as a member or previously as creator)
            const existingMembers = membersByGroup.get(group.id) || [];
            if (existingMembers.some(m => m.id === group.user_id)) return; // Skip if already added
            
            const profile = profiles.find(p => p.id === group.user_id);
            // Ensure group exists in map and profile was found
            if (profile && membersByGroup.has(group.id)) {
              membersByGroup.get(group.id).push({
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                role: 'creator',
                status: 'accepted' // Assume creator is always accepted
              });
            }
          });
        }
        
        // Add the current user to the groups they belong to (if not already added)
        const currentUserProfile = {
          id: user.id,
          username: user.user_metadata?.username || user.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        };

        groupIds.forEach(groupId => {
          const group = memoizedFriendGroups.find(g => g.id === groupId);
          if (!group) return;
          
          const membersList = membersByGroup.get(groupId) || [];
          
          // Check if current user is already in the list for this group
          if (membersList.some(m => m.id === user.id)) return; 

          // Check if current user is the creator or an accepted member
          const isCreator = group.user_id === user.id;
          const currentUserMembership = groupMembers?.find(gm => gm.group_id === groupId && gm.friend_id === user.id);
          const isAcceptedMember = currentUserMembership?.status === 'accepted';

          // Add current user if they are creator or accepted member
          if (isCreator || isAcceptedMember) {
            membersList.push({
              ...currentUserProfile,
              role: isCreator ? 'creator' : 'member',
              status: 'accepted' // Assume accepted if creator or accepted member
            });
            membersByGroup.set(groupId, membersList); // Update the map
          }
        });

        // 6. Store the results
        const finalMembersByGroup = Array.from(membersByGroup.entries()).map(([groupId, members]) => ({
            groupId,
            members
          }));
        // REMOVE Log: if (isDevelopment()) console.log('[useGroupScores] Fetched Member Profiles (membersByGroup):', JSON.stringify(finalMembersByGroup));

        setMemberProfilesData(prev => ({
          ...prev,
          membersByGroup: finalMembersByGroup,
          lastUpdated: Date.now()
        }));
        
      } catch (error) {
        console.error('Error in fetchAllGroupMembers:', error);
      }
    };
    
    fetchAllGroupMembers();
  }, [user, memoizedFriendGroups]);
  
  // Process group data more efficiently with the simplified approach
  const processedGroupData = useMemo(() => {
    // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Calculating processedGroupData for gameId: ${memoizedGameId}`);
    // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Using allTodaysScores:`, JSON.stringify(allTodaysScores));
    // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Using memberProfilesData:`, JSON.stringify(memberProfilesData));

    // Use simpler initial check
    if (!user || !memoizedGameId || !allTodaysScores) { 
        // REMOVE Log: if (isDevelopment()) console.log("[useGroupScores] Bailing early from processedGroupData due to missing user, gameId, or initial allTodaysScores.");
        return []; // Return empty if essential data is missing
    }

    try {
        // REMOVE Log: if (isDevelopment()) console.log("[useGroupScores] Starting group mapping...");
        const result = memoizedFriendGroups.map(group => {
            // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Processing group: ${group.name} (${group.id})`);
            // Find today's score for the current user
            const userTodayScore = allTodaysScores.find(score => 
                score.playerId === user.id && score.gameId === memoizedGameId
            );
            const userHasPlayed = !!userTodayScore;
            const userScore = userHasPlayed ? userTodayScore.value : null;

            // Find the definitive list of members for this group from memberProfilesData
            const groupMembersData = memberProfilesData.membersByGroup.find(gmd => gmd.groupId === group.id);
            const actualMembers = groupMembersData ? groupMembersData.members : []; // Use fetched members
            
            // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Group ${group.id} - Actual Members:`, JSON.stringify(actualMembers));

            // Map over the actual members fetched from the database
            const membersPerformance: GroupMemberPerformance[] = actualMembers.map(member => {
                // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores]   Mapping score for member: ${member.full_name || member.username} (${member.id})`);
                // Look for this member's score in allTodaysScores
                const friendScore = allTodaysScores.find(score => 
                    score.playerId === member.id && score.gameId === memoizedGameId
                );
                
                // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores]     - Found score for ${member.id} & game ${memoizedGameId}:`, friendScore ? JSON.stringify({ value: friendScore.value, date: friendScore.date }) : 'null');
                
                const hasPlayed = !!friendScore;
                const score = hasPlayed ? friendScore.value : null;
                
                // Use profile data for name consistency
                const playerName = member.full_name || member.username || "Unknown Member";
                
                return {
                    playerId: member.id,
                    playerName: playerName,
                    hasPlayed: hasPlayed,
                    score: score
                };
            });
            // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Group ${group.id} - Final Members Performance:`, membersPerformance);
            return {
                groupId: group.id,
                groupName: group.name,
                currentUserHasPlayed: userHasPlayed,
                currentUserScore: userScore,
                members: membersPerformance // Use the processed list based on actual members
            };
        });
        // REMOVE Log: if (isDevelopment()) console.log("[useGroupScores] Finished group mapping. Final processedGroupData:", JSON.stringify(result));
        return result;
    } catch (error) {
        console.error('[useGroupScores] Error processing group data:', error);
        return [];
    }
  }, [
    user?.id, 
    memoizedGameId, 
    allTodaysScores, 
    memoizedFriendGroups, 
    memberProfilesData // Add dependency on the fetched member/profile data
  ]);
  
  // Update group performance data only when processed data actually changes
  useEffect(() => {
    if (processedGroupData && JSON.stringify(processedGroupData) !== JSON.stringify(groupPerformanceData)) {
      // REMOVE Log: if (isDevelopment()) console.log(`[useGroupScores] Updating groupPerformanceData state...`);
      setGroupPerformanceData(processedGroupData);
    }
  }, [processedGroupData]);
  
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
