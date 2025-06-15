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
  const { user } = useAuth();
  const { friends, refreshFriends } = useFriendsList();
  const { friendGroups } = useFriendGroups(friends);
  const [isLoading, setIsLoading] = useState(true);
  const [groupPerformanceData, setGroupPerformanceData] = useState<GroupPerformance[]>([]);
  const [allTodaysScores, setAllTodaysScores] = useState<Score[]>([]);
  const [allFriendsData, setAllFriendsData] = useState<AllFriendsPerformance | null>(null);
  const [memberProfilesData, setMemberProfilesData] = useState<MemberProfilesData>({ profiles: [], groupMembership: [], membersByGroup: [], lastUpdated: 0 });
  
  // Use ref to track if this is the first render
  const isFirstRender = useRef(true);
  const firstLoadDone = useRef(false);
  
  // Store previous values to compare and avoid unnecessary updates
  const prevGameId = useRef<string | null>(null);
  const prevAllTodaysScores = useRef<Score[]>([]);
  
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
  
  // Fetch all today's scores - Simplified Trigger
  useEffect(() => {
    // Skip the first render (handled by initial state)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Skip if gameId is null
    if (!memoizedGameId) {
      setAllTodaysScores([]); // Clear scores if no game selected
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    const controller = new AbortController(); // Keep abort controller
    
    const fetchAllTodaysScores = async () => {
      // REMOVED: Throttling logic based on lastFetchTime
      
      try {
        setIsLoading(true);
        
        // Always fetch when effect runs (triggered by gameId or todaysScores prop change)
        const scores = await getTodaysGamesForAllUsers(memoizedGameId);
        
        // Optimization: Skip state update only if data is identical (optional, can be removed if causing issues)
        if (JSON.stringify(scores) === JSON.stringify(prevAllTodaysScores.current) && firstLoadDone.current) {
           setIsLoading(false);
           return;
        }
        
        if (isMounted) {
          prevAllTodaysScores.current = scores; // Update previous scores ref
          setAllTodaysScores(scores);
          firstLoadDone.current = true; // Mark that first load for a game is done
        }
      } catch (error) {
        console.error('Error fetching all today\'s scores:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllTodaysScores();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
    // Dependency array now includes memoizedTodaysScores
  }, [memoizedGameId, memoizedTodaysScores]); 
  
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
    if (!user || !memoizedGameId || !allTodaysScores) { 
        return [];
    }

    try {
        const result = memoizedFriendGroups.map(group => {
            // Find today's score for the current user
            const userTodayScore = allTodaysScores.find(score => 
                score.playerId === user.id && score.gameId === memoizedGameId
            );
            const userHasPlayed = !!userTodayScore;
            const userScore = userHasPlayed ? userTodayScore.value : null;

            // Find the definitive list of members for this group from memberProfilesData
            const groupMembersData = memberProfilesData.membersByGroup.find(gmd => gmd.groupId === group.id);
            const actualMembers = groupMembersData ? groupMembersData.members : []; // Use fetched members
            
            // Map over the actual members fetched from the database
            const membersPerformance: GroupMemberPerformance[] = actualMembers.map(member => {
                // Look for this member's score in allTodaysScores
                const friendScore = allTodaysScores.find(score => 
                    score.playerId === member.id && score.gameId === memoizedGameId
                );
                
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
            return {
                groupId: group.id,
                groupName: group.name,
                currentUserHasPlayed: userHasPlayed,
                currentUserScore: userScore,
                members: membersPerformance // Use the processed list based on actual members
            };
        });
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
      setGroupPerformanceData(processedGroupData);
    }
  }, [processedGroupData]);
  
  const handleRefreshFriends = useCallback(async () => {
    // If we need explicit refresh, trigger parent or rely on dependency changes
    // REMOVE: fetchAllTodaysScoresRef.current?.(true);
    // REMOVE: Consider adding refresh logic if needed, e.g., invalidating parent query
  }, []);
  
  // Effect to handle refreshing when friends list changes externally
  useEffect(() => {
    // Potentially trigger a refresh if needed when friends change
    // REMOVE: fetchAllTodaysScoresRef.current?.(true);
  }, [friends]); // Assuming `friends` comes from a context/prop that updates
  
  // Return values from the hook
  return {
    isLoading,
    groupPerformanceData,
    allFriendsData,
    refreshFriends: handleRefreshFriends // Keep the callback if used elsewhere
  };
};
