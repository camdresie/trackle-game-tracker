
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
    includeCurrentUser: false
  });
  
  // Get the current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch friend scores when selectedGameId changes
  useEffect(() => {
    if (selectedGameId && friends.length > 0) {
      fetchFriendScores();
    }
  }, [selectedGameId, friends, fetchFriendScores]);
  
  // Process the data when everything is loaded
  useEffect(() => {
    if (isLoadingGroups || isLoadingFriendScores || !selectedGameId) {
      setIsLoading(true);
      return;
    }
    
    try {
      // Map the friendGroups to include who has played today and their scores
      const groupData = friendGroups.map(group => {
        const memberData = group.members.map(member => {
          // Check if this friend has played the selected game today
          const friendTodayScores = friendScores[member.id] || [];
          const todayScore = friendTodayScores.find(
            score => score.gameId === selectedGameId && score.date === today
          );
          
          return {
            playerId: member.id,
            playerName: member.name,
            hasPlayed: !!todayScore,
            score: todayScore ? todayScore.value : null
          };
        });
        
        return {
          groupId: group.id,
          groupName: group.name,
          members: memberData
        };
      });
      
      setGroupPerformanceData(groupData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing group performance data:', error);
      toast.error('Failed to load group performance data');
      setIsLoading(false);
    }
  }, [friendGroups, friendScores, selectedGameId, isLoadingGroups, isLoadingFriendScores, today]);
  
  return {
    isLoading: isLoading || isLoadingGroups || isLoadingFriendScores,
    groupPerformanceData
  };
};
