
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from './useFriendsList';
import { useFriendGroups } from './useFriendGroups';
import { useFriendScores } from './useFriendScores';
import { Score } from '@/utils/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';

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

/**
 * Get the current date in Eastern Time (ET)
 * @returns Date string in YYYY-MM-DD format for Eastern Time
 */
const getEasternTimeDate = (): string => {
  // Get current date in Eastern Time for consistency
  const easternTime = formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
  console.log("[useGroupScores] Eastern timezone today's date:", easternTime);
  return easternTime;
};

export const useGroupScores = (
  selectedGameId: string | null,
  todaysScores: Score[]
): GroupScoresResult => {
  const { user } = useAuth();
  const { friends } = useFriendsList();
  const { friendGroups, isLoading: isLoadingGroups } = useFriendGroups(friends);
  const [isLoading, setIsLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  // Use Eastern Time for date consistency across the app
  const today = useMemo(() => getEasternTimeDate(), []);

  // Debug logging
  useEffect(() => {
    console.log('[useGroupScores] Today\'s date:', today);
    console.log('[useGroupScores] Today\'s scores:', todaysScores);
    console.log('[useGroupScores] Selected game ID:', selectedGameId);
    console.log('[useGroupScores] Friend groups:', friendGroups);
  }, [today, todaysScores, selectedGameId, friendGroups]);

  // Fetch group members with their profiles - improved query to properly join profile data
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!friendGroups || friendGroups.length === 0) {
        console.log('[useGroupScores] No friend groups available');
        setGroupMembers([]);
        return;
      }

      try {
        const groupIds = friendGroups.map(group => group.id);
        console.log('[useGroupScores] Fetching members for groups:', groupIds);
        
        // Updated query: Include status filter to only get accepted members
        const { data: members, error } = await supabase
          .from('friend_group_members')
          .select('id, group_id, friend_id, status')
          .in('group_id', groupIds)
          .eq('status', 'accepted');
          
        if (error) throw error;
        
        if (!members || members.length === 0) {
          console.log('[useGroupScores] No members found');
          setGroupMembers([]);
          return;
        }
        
        console.log('[useGroupScores] Found members:', members);
        
        // Then get all profiles for these members in a separate query
        const memberIds = members.map(m => m.friend_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', memberIds);
          
        if (profilesError) throw profilesError;
        
        if (!profiles) {
          console.log('[useGroupScores] No profiles found for members');
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
        
        console.log('[useGroupScores] Members with profiles:', membersWithProfiles);
        setGroupMembers(membersWithProfiles);
        
      } catch (error) {
        console.error('[useGroupScores] Error fetching group members:', error);
        toast.error('Failed to load group members');
        setGroupMembers([]);
      }
    };

    if (friendGroups && friendGroups.length > 0) {
      fetchGroupMembers();
    } else {
      setGroupMembers([]);
    }
  }, [friendGroups]);

  // Use useFriendScores to get scores for all friends
  const { friendScores, isLoading: isLoadingFriendScores } = useFriendScores({
    gameId: selectedGameId || undefined,
    friends,
    includeCurrentUser: true,
    currentUserScores: todaysScores
  });

  // Process group performance data
  const groupPerformanceData = useMemo(() => {
    if (!friendGroups || friendGroups.length === 0) {
      console.log('[useGroupScores] No friend groups to process');
      return [];
    }

    console.log('[useGroupScores] Processing groups:', friendGroups);
    console.log('[useGroupScores] Group members:', groupMembers);
    console.log('[useGroupScores] Friend scores:', friendScores);
    console.log('[useGroupScores] Today\'s scores for current user:', todaysScores);
    
    return friendGroups.map(group => {
      // Get all members for this group
      const members = groupMembers
        .filter(member => member.group_id === group.id)
        .map(member => {
          const memberScores = friendScores[member.friend_id] || [];
          const todayScore = memberScores.find(score => 
            score.gameId === selectedGameId && score.date === today
          );
          
          console.log(`[useGroupScores] Member ${member.profiles?.username} scores for game ${selectedGameId}:`, 
            memberScores.filter(score => score.gameId === selectedGameId));
          console.log(`[useGroupScores] Today's score for ${member.profiles?.username}:`, todayScore);
          
          return {
            playerId: member.friend_id,
            playerName: member.profiles?.username || member.profiles?.full_name || 'Unknown User',
            hasPlayed: !!todayScore,
            score: todayScore?.value || null
          };
        });

      // Find current user's score for today and this game
      const userTodayScore = user && todaysScores.find(
        score => score.gameId === selectedGameId && 
                 score.playerId === user.id
      );
      
      console.log(`[useGroupScores] Current user's today score for ${selectedGameId}:`, userTodayScore);
      
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
  }, [friendGroups, groupMembers, selectedGameId, friendScores, user, todaysScores, today]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isLoadingGroups || isLoadingFriendScores);
  }, [isLoadingGroups, isLoadingFriendScores]);

  return {
    isLoading,
    groupPerformanceData
  };
};
