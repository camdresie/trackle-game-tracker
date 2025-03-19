
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from './useFriendsList';
import { useFriendGroups } from './useFriendGroups';
import { useFriendScores } from './useFriendScores';
import { Score } from '@/utils/types';
import { toast } from 'sonner';

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
  const [groupPerformanceData, setGroupPerformanceData] = useState<GroupScoresResult['groupPerformanceData']>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the friendScores hook to get today's scores for friends
  const { friendScores, isLoading: isLoadingFriendScores } = useFriendScores({
    gameId: selectedGameId || undefined,
    friends: friends,
    includeCurrentUser: true,
    currentUserScores: todaysScores
  });
  
  // Get the current date in YYYY-MM-DD format
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Debug logging
  useEffect(() => {
    if (selectedGameId) {
      console.log('[useGroupScores] Selected game ID:', selectedGameId);
      console.log('[useGroupScores] Friend groups:', friendGroups);
      console.log('[useGroupScores] Friend scores:', friendScores);
      console.log('[useGroupScores] Today\'s scores:', todaysScores);
      console.log('[useGroupScores] Current user ID:', user?.id);
    }
  }, [selectedGameId, friendGroups, friendScores, todaysScores, user]);
  
  // Get current user's score for today
  const getCurrentUserScore = (): number | null => {
    if (!user || !selectedGameId) return null;
    
    // First check in friendScores if includeCurrentUser was true
    const userScoresFromHook = friendScores[user.id] || [];
    const userScoreFromHook = userScoresFromHook.find(
      score => score.gameId === selectedGameId && score.date === today
    );
    
    if (userScoreFromHook) {
      console.log('[useGroupScores] Found user score in friendScores:', userScoreFromHook.value);
      return userScoreFromHook.value;
    }
    
    // Then check in todaysScores as fallback
    const userScoreFromToday = todaysScores.find(
      score => score.gameId === selectedGameId && score.date === today
    );
    
    if (userScoreFromToday) {
      console.log('[useGroupScores] Found user score in todaysScores:', userScoreFromToday.value);
      return userScoreFromToday.value;
    }
    
    console.log('[useGroupScores] No user score found for today');
    return null;
  };
  
  // Process the data when everything is loaded
  useEffect(() => {
    if (isLoadingGroups || isLoadingFriendScores || !selectedGameId) {
      setIsLoading(true);
      return;
    }
    
    try {
      console.log('[useGroupScores] Processing group data');
      const currentUserScore = getCurrentUserScore();
      const currentUserHasPlayed = currentUserScore !== null;
      
      console.log('[useGroupScores] Current user score:', currentUserScore);
      console.log('[useGroupScores] Current user has played:', currentUserHasPlayed);
      
      // Map the friendGroups to include who has played today and their scores
      const groupData = friendGroups.map(group => {
        console.log(`[useGroupScores] Processing group ${group.name} with ${group.members?.length || 0} members`);
        
        if (!group.members) {
          return {
            groupId: group.id,
            groupName: group.name,
            currentUserScore,
            currentUserHasPlayed,
            members: []
          };
        }
        
        // Process all members in this group
        const memberData = group.members.map(member => {
          // Skip if this is the current user (we'll add them separately)
          if (member.id === user?.id) {
            console.log(`[useGroupScores] Skipping current user ${member.name}`);
            return null;
          }
          
          // Get this friend's scores
          const friendScoresList = friendScores[member.id] || [];
          
          // Find today's score for this friend and this game
          const todayScore = friendScoresList.find(
            score => score.gameId === selectedGameId && score.date === today
          );
          
          const hasPlayed = !!todayScore;
          const score = todayScore ? todayScore.value : null;
          
          console.log(`[useGroupScores] Friend ${member.name} has played today: ${hasPlayed}, score: ${score}`);
          
          return {
            playerId: member.id,
            playerName: member.name || 'Unknown',
            hasPlayed,
            score
          };
        }).filter(Boolean); // Remove null entries (current user)
        
        return {
          groupId: group.id,
          groupName: group.name,
          currentUserScore,
          currentUserHasPlayed,
          members: memberData as {
            playerId: string;
            playerName: string;
            hasPlayed: boolean;
            score?: number | null;
          }[]
        };
      });
      
      console.log('[useGroupScores] Final group data:', groupData);
      setGroupPerformanceData(groupData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing group performance data:', error);
      toast.error('Failed to load group performance data');
      setIsLoading(false);
    }
  }, [friendGroups, friendScores, selectedGameId, isLoadingGroups, isLoadingFriendScores, today, todaysScores, user]);
  
  return {
    isLoading: isLoading || isLoadingGroups || isLoadingFriendScores,
    groupPerformanceData
  };
};
