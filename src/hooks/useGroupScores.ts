
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from './useFriendsList';
import { useFriendGroups } from './useFriendGroups';
import { useFriendScores } from './useFriendScores';
import { Score } from '@/utils/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getTodayInEasternTime } from '@/utils/dateUtils';

export interface GroupScoresResult {
  isLoading: boolean;
  groupPerformanceData: {
    groupId: string;
    groupName: string;
    currentUserScore: number | null;
    currentUserHasPlayed: boolean;
    members: {
      playerId: string;
      playerName: string;
      hasPlayed: boolean;
      score?: number | null;
    }[];
  }[];
}

export const useGroupScores = (
  selectedGameId: string | null,
  todaysScores: Score[]
): GroupScoresResult => {
  const { user } = useAuth();
  const { friends } = useFriendsList();
  const { friendGroups, isLoading: isLoadingGroups } = useFriendGroups(friends);
  const [isLoading, setIsLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupCreators, setGroupCreators] = useState<{[key: string]: string}>({});

  // Use Eastern Time for date consistency across the app
  const today = useMemo(() => getTodayInEasternTime(), []);

  // Fetch group members with their profiles - improved query to properly join profile data
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!friendGroups || friendGroups.length === 0) {
        setGroupMembers([]);
        return;
      }

      try {
        const groupIds = friendGroups.map(group => group.id);
        
        // Store group creators for later use
        const creatorMap: {[key: string]: string} = {};
        friendGroups.forEach(group => {
          creatorMap[group.id] = group.user_id;
        });
        setGroupCreators(creatorMap);
        
        // Updated query: Include status filter to only get accepted members
        const { data: members, error } = await supabase
          .from('friend_group_members')
          .select('id, group_id, friend_id, status')
          .in('group_id', groupIds)
          .eq('status', 'accepted');
          
        if (error) {
          console.error('Error fetching group members:', error);
          toast.error('Failed to load group members');
          throw error;
        }
        
        if (!members || members.length === 0) {
          // Even if no members were found, we should include group creators
          const memberIds: string[] = [];
          
          // Add all group creators to the member IDs
          Object.values(creatorMap).forEach(creatorId => {
            if (!memberIds.includes(creatorId)) {
              memberIds.push(creatorId);
            }
          });
          
          // Add the current user to make sure they're included in profile lookup
          if (user && !memberIds.includes(user.id)) {
            memberIds.push(user.id);
          }
          
          if (memberIds.length === 0) {
            setGroupMembers([]);
            return;
          }
          
          // Fetch profiles for group creators and current user
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', memberIds);
            
          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            toast.error('Failed to load member profiles');
            throw profilesError;
          }
          
          // Create virtual members for group creators
          const creatorsAsMembers = [];
          for (const groupId in creatorMap) {
            const creatorId = creatorMap[groupId];
            const profile = profiles?.find(p => p.id === creatorId);
            
            if (profile) {
              creatorsAsMembers.push({
                id: `creator-${groupId}`,
                group_id: groupId,
                friend_id: creatorId,
                status: 'accepted',
                profiles: profile
              });
            }
          }
          
          setGroupMembers(creatorsAsMembers);
          return;
        }
        
        // Then get all profiles for these members in a separate query
        const memberIds = members.map(m => m.friend_id);
        
        // Add all group creators to the member IDs
        Object.values(creatorMap).forEach(creatorId => {
          if (!memberIds.includes(creatorId)) {
            memberIds.push(creatorId);
          }
        });
        
        // Add the current user to make sure they're included in profile lookup
        if (user && !memberIds.includes(user.id)) {
          memberIds.push(user.id);
        }
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', memberIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          toast.error('Failed to load member profiles');
          throw profilesError;
        }
        
        if (!profiles) {
          setGroupMembers([]);
          return;
        }
        
        // Combine member data with profiles
        const membersWithProfiles = members.map(member => {
          const profile = profiles.find(p => p.id === member.friend_id);
          return {
            ...member,
            profiles: profile || { id: member.friend_id, username: 'Unknown User' }
          };
        });
        
        // Add group creators as virtual members if they're not already included
        for (const groupId in creatorMap) {
          const creatorId = creatorMap[groupId];
          const isCreatorAlreadyMember = membersWithProfiles.some(
            m => m.group_id === groupId && m.friend_id === creatorId
          );
          
          if (!isCreatorAlreadyMember) {
            const profile = profiles.find(p => p.id === creatorId);
            if (profile) {
              membersWithProfiles.push({
                id: `creator-${groupId}`,
                group_id: groupId,
                friend_id: creatorId,
                status: 'accepted',
                profiles: profile
              });
            }
          }
        }
        
        setGroupMembers(membersWithProfiles);
        
      } catch (error) {
        console.error('Error fetching group members:', error);
        toast.error('Failed to load group members');
        setGroupMembers([]);
      }
    };

    if (friendGroups && friendGroups.length > 0) {
      fetchGroupMembers();
    } else {
      setGroupMembers([]);
    }
  }, [friendGroups, user]);

  // Use useFriendScores to get scores for all friends, and also include group creators
  const { friendScores, isLoading: isLoadingFriendScores } = useFriendScores({
    gameId: selectedGameId || undefined,
    friends: [
      ...friends,
      // Include group creators as "friends" for score fetching
      ...Object.values(groupCreators)
        .filter(creatorId => !friends.some(f => f.id === creatorId) && creatorId !== user?.id)
        .map(creatorId => ({ id: creatorId, name: 'Group Creator' }))
    ],
    includeCurrentUser: true,
    currentUserScores: todaysScores
  });

  // Process group performance data
  const groupPerformanceData = useMemo(() => {
    if (!friendGroups || friendGroups.length === 0) {
      return [];
    }

    return friendGroups.map(group => {
      // Get all members for this group
      const members = groupMembers
        .filter(member => member.group_id === group.id)
        .map(member => {
          const memberScores = friendScores[member.friend_id] || [];
          const todayScore = memberScores.find(score => 
            score.gameId === selectedGameId && score.date === today
          );
          
          return {
            playerId: member.friend_id,
            playerName: member.profiles?.username || member.profiles?.full_name || 'Unknown User',
            hasPlayed: !!todayScore,
            score: todayScore?.value || null
          };
        });

      // Check if the current user is the group creator
      const isCurrentUserCreator = user?.id === group.user_id;
      
      // Find current user's score for today and this game
      const userTodayScore = user && todaysScores.find(
        score => score.gameId === selectedGameId && 
                 score.playerId === user.id
      );
      
      const currentUserScore = userTodayScore?.value || null;
      const currentUserHasPlayed = !!userTodayScore;

      return {
        groupId: group.id,
        groupName: group.name,
        currentUserScore,
        currentUserHasPlayed,
        members
      };
    });
  }, [friendGroups, groupMembers, selectedGameId, friendScores, user, todaysScores, today, groupCreators]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isLoadingGroups || isLoadingFriendScores);
  }, [isLoadingGroups, isLoadingFriendScores]);

  return {
    isLoading,
    groupPerformanceData
  };
};
