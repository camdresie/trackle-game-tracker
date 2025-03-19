
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from './useFriendsList';
import { useFriendGroups } from './useFriendGroups';
import { useFriendScores } from './useFriendScores';
import { Game, Player, Score } from '@/utils/types';
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
  const { friendScores, fetchFriendScores, isLoading: isLoadingFriendScores } = useFriendScores({
    gameId: selectedGameId || undefined,
    friends: friends,
    includeCurrentUser: true
  });
  
  // Get the current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
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
  
  // Fetch friend scores when selectedGameId changes
  useEffect(() => {
    if (selectedGameId && friends.length > 0) {
      console.log('[useGroupScores] Fetching friend scores for game:', selectedGameId);
      fetchFriendScores();
    }
  }, [selectedGameId, friends, fetchFriendScores]);
  
  // Get current user's score for today
  const getCurrentUserScore = (): number | null => {
    if (!user || !selectedGameId) return null;
    
    // First check in friendScores if includeCurrentUser was true
    const userScoresFromHook = friendScores[user.id] || [];
    const userScoreFromHook = userScoresFromHook.find(
      score => score.gameId === selectedGameId && score.date === today
    );
    
    if (userScoreFromHook) {
      return userScoreFromHook.value;
    }
    
    // Then check in todaysScores as fallback
    const userScoreFromToday = todaysScores.find(
      score => score.gameId === selectedGameId && score.date === today
    );
    
    return userScoreFromToday ? userScoreFromToday.value : null;
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
        
        const memberData = group.members.map(member => {
          // Check if this friend has played the selected game today
          const friendTodayScores = friendScores[member.id] || [];
          const todayScore = friendTodayScores.find(
            score => score.gameId === selectedGameId && score.date === today
          );
          
          console.log(`[useGroupScores] Friend ${member.name} has played today: ${!!todayScore}, score: ${todayScore?.value}`);
          
          return {
            playerId: member.id,
            playerName: member.name || 'Unknown',
            hasPlayed: !!todayScore,
            score: todayScore ? todayScore.value : null
          };
        });
        
        return {
          groupId: group.id,
          groupName: group.name,
          currentUserScore,
          currentUserHasPlayed,
          members: memberData
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
