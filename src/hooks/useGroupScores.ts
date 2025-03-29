
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useFriendGroups } from '@/hooks/useFriendGroups';
import { Score } from '@/utils/types';
import { getTodaysGamesForAllUsers } from '@/services/todayService';

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
  const [groupPerformanceData, setGroupPerformanceData] = useState<GroupPerformance[]>([]);
  const [allTodaysScores, setAllTodaysScores] = useState<Score[]>([]);
  
  // Fetch all today's scores for the selected game
  useEffect(() => {
    const fetchAllTodaysScores = async () => {
      if (!gameId) {
        setAllTodaysScores([]);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log(`Fetching ALL today's scores for game ${gameId}`);
        const scores = await getTodaysGamesForAllUsers(gameId);
        console.log(`Got ${scores.length} today scores for all users`);
        setAllTodaysScores(scores);
      } catch (error) {
        console.error('Error fetching all today\'s scores:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllTodaysScores();
  }, [gameId]);
  
  // Process the data whenever dependencies change
  useEffect(() => {
    if (!user || !gameId) {
      setGroupPerformanceData([]);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log(`Processing group data with ${allTodaysScores.length} today scores`);
      
      // Get today's score for the current user from their own scores
      const userTodayScore = todaysScores.find(score => 
        score.gameId === gameId && score.playerId === user.id
      );
      
      const userHasPlayed = !!userTodayScore;
      const userScore = userHasPlayed ? userTodayScore.value : null;
      console.log(`Current user has played: ${userHasPlayed}, score: ${userScore}`);
      
      // Even if the user has no groups/friends, we should return an empty array
      // but with the current user's data for the "All Friends" view
      if (friendGroups.length === 0) {
        // If no groups exist, still include user data
        setGroupPerformanceData([{
          groupId: 'default',
          groupName: 'All Friends',
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
          // Look in allTodaysScores for this friend's score
          const memberTodayScore = allTodaysScores.find(score =>
            score.gameId === gameId && score.playerId === member.id
          );
          
          const hasPlayed = !!memberTodayScore;
          const score = hasPlayed ? memberTodayScore.value : null;
          
          console.log(`Friend ${member.name} (${member.id}) has played: ${hasPlayed}, score: ${score || 'none'}`);
          
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
  }, [user, gameId, todaysScores, friends, friendGroups, allTodaysScores]);
  
  return { isLoading, groupPerformanceData };
};
