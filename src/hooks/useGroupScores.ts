
import { useState, useEffect, useMemo } from 'react';
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

  // Fetch group members with their profiles
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!friendGroups.length) return;

      try {
        const groupIds = friendGroups.map(group => group.id);
        
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
        console.log('Fetched group members:', members);
        setGroupMembers(members || []);
      } catch (error) {
        console.error('Error fetching group members:', error);
        toast.error('Failed to load group members');
      }
    };

    if (friendGroups.length > 0) {
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
    if (!friendGroups) return [];

    return friendGroups.map(group => {
      // Get all members for this group - fixed the bug here
      const getGroupMembers = (allMembers: any[]) => {
        return allMembers
          .filter(member => member.group_id === group.id)
          .map(member => ({
            playerId: member.friend_id,
            playerName: member.profiles?.username || 'Unknown',
            hasPlayed: false, // Will be updated below
            score: null // Will be updated below
          }));
      };

      const members = getGroupMembers(groupMembers);
      console.log(`Processing group ${group.name} with ${members.length} members`);

      // Get current user's score for today
      const currentUserScore = user && todaysScores.find(
        score => score.gameId === selectedGameId && 
                 score.playerId === user.id && 
                 score.date === today
      )?.value || null;

      // Update member scores
      members.forEach(member => {
        const memberScores = friendScores[member.playerId] || [];
        const todayScore = memberScores.find(
          score => score.gameId === selectedGameId && score.date === today
        );
        
        member.hasPlayed = !!todayScore;
        member.score = todayScore?.value || null;

        console.log(`Member ${member.playerName} today's score:`, todayScore?.value);
      });

      return {
        groupId: group.id,
        groupName: group.name,
        currentUserScore,
        currentUserHasPlayed: currentUserScore !== null,
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
