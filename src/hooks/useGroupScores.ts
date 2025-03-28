import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { Score } from '@/utils/types';

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

export const useGroupScores = (gameId: string | null, todaysScores: Score[]) => {
  const { user } = useAuth();
  const { friends } = useFriendsList();
  const { friendGroups } = useFriendGroups(friends);
  const [isLoading, setIsLoading] = useState(true);
  const [groupPerformanceData, setGroupPerformanceData] = useState<any[]>([]);
  
  // Process the data whenever dependencies change
  useEffect(() => {
    setIsLoading(true);
    
    const processData = async () => {
      if (!user || !gameId) {
        setGroupPerformanceData([]);
        setIsLoading(false);
        return;
      }
      
      try {
        // Get today's score for the current user
        const userTodayScore = todaysScores.find(score => 
          score.gameId === gameId && score.playerId === user.id
        );
        
        const userHasPlayed = !!userTodayScore;
        const userScore = userHasPlayed ? userTodayScore.value : null;
        
        // Even if the user has no groups/friends, we should return an empty array
        // but with the current user's data for the "All Friends" view
        if (friendGroups.length === 0) {
          // If no groups exist, still include user data
          setGroupPerformanceData([{
            currentUserHasPlayed: userHasPlayed,
            currentUserScore: userScore,
            members: [] // No friends yet
          }]);
          setIsLoading(false);
          return;
        }
        
        // Process friend groups
        const processedGroups = friendGroups.map(group => {
          // Get today's scores for each member of the group
          const members = group.members?.map(member => {
            const memberTodayScore = todaysScores.find(score =>
              score.gameId === gameId && score.playerId === member.id
            );
            
            const hasPlayed = !!memberTodayScore;
            const score = hasPlayed ? memberTodayScore.value : null;
            
            return {
              playerId: member.id,
              playerName: member.name,
              hasPlayed: hasPlayed,
              score: score
            };
          }) || [];
          
          return {
            groupId: group.id,
            groupName: group.name,
            currentUserHasPlayed: userHasPlayed,
            currentUserScore: userScore,
            members: members
          };
        });
        
        setGroupPerformanceData(processedGroups);
      } catch (error) {
        console.error('Error processing group performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    processData();
  }, [user, gameId, todaysScores, friends, friendGroups]);
  
  return { isLoading, groupPerformanceData };
};
