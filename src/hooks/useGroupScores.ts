
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from './useFriendsList';
import { useFriendGroups } from './useFriendGroups';
import { useFriendScores } from './useFriendScores';
import { Score } from '@/utils/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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

  // Use the current date for filtering today's scores
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Debug logging
  useEffect(() => {
    console.log('[useGroupScores] Today\'s date:', today);
    console.log('[useGroupScores] Today\'s scores:', todaysScores);
    console.log('[useGroupScores] Selected game ID:', selectedGameId);
    console.log('[useGroupScores] Friend groups:', friendGroups);
  }, [today, todaysScores, selectedGameId, friendGroups]);

  // Fetch group members with their profiles
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!friendGroups || friendGroups.length === 0) {
        console.log('[useGroupScores] No friend groups available');
        return;
      }

      try {
        const groupIds = friendGroups.map(group => group.id);
        console.log('[useGroupScores] Fetching members for group IDs:', groupIds);
        
        // Fetch all group members and their profiles in a single query
        const { data: members, error } = await supabase
          .from('friend_group_members')
          .select(`
            id,
            group_id,
            friend_id,
            status,
            profiles:friend_id (
              id,
              username,
              full_name
            )
          `)
          .in('group_id', groupIds)
          .eq('status', 'accepted');

        if (error) throw error;
        console.log('[useGroupScores] Fetched group members:', members);
        setGroupMembers(members || []);
      } catch (error) {
        console.error('[useGroupScores] Error fetching group members:', error);
        toast.error('Failed to load group members');
      }
    };

    if (friendGroups && friendGroups.length > 0) {
      fetchGroupMembers();
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
    
    return friendGroups.map(group => {
      // Get all members for this group
      const getGroupMembers = (allMembers: any[]) => {
        if (!allMembers || !Array.isArray(allMembers)) {
          console.warn('[useGroupScores] allMembers is not an array:', allMembers);
          return [];
        }
        
        return allMembers
          .filter(member => member && member.group_id === group.id)
          .map(member => ({
            playerId: member.friend_id,
            playerName: member.profiles?.username || member.profiles?.full_name || 'Unknown',
            hasPlayed: false, // Will be updated below
            score: null // Will be updated below
          }));
      };

      const members = getGroupMembers(groupMembers);
      console.log(`[useGroupScores] Processing group ${group.name} with ${members.length} members`);

      // Find current user's score for today and this game
      console.log(`[useGroupScores] Looking for score with gameId=${selectedGameId} in today's scores:`, todaysScores);
      const userTodayScore = user && todaysScores.find(
        score => score.gameId === selectedGameId && 
                 score.playerId === user.id && 
                 score.date === today
      );
      
      console.log(`[useGroupScores] Current user's today score for ${selectedGameId}:`, userTodayScore);
      
      const currentUserScore = userTodayScore?.value || null;
      const currentUserHasPlayed = !!userTodayScore;

      // Update member scores
      members.forEach(member => {
        const memberScores = friendScores[member.playerId] || [];
        console.log(`[useGroupScores] Scores for member ${member.playerName}:`, memberScores);
        
        const todayScore = memberScores.find(
          score => score.gameId === selectedGameId && score.date === today
        );
        
        member.hasPlayed = !!todayScore;
        member.score = todayScore?.value || null;

        console.log(`[useGroupScores] Member ${member.playerName} today's score:`, todayScore?.value);
      });

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
