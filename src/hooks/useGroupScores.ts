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

// Define a type for all friends' performance data
interface AllFriendsPerformance {
  members: GroupMemberPerformance[];
  currentUserHasPlayed: boolean;
  currentUserScore: number | null;
}

export const useGroupScores = (gameId: string | null, todaysScores: Score[]) => {
  const { user } = useAuth();
  const { friends, refreshFriends } = useFriendsList();
  const { friendGroups } = useFriendGroups(friends);
  const [isLoading, setIsLoading] = useState(true);
  const [groupPerformanceData, setGroupPerformanceData] = useState<GroupPerformance[]>([]);
  const [allTodaysScores, setAllTodaysScores] = useState<Score[]>([]);
  const [allFriendsData, setAllFriendsData] = useState<AllFriendsPerformance | null>(null);
  
  // Debug friends list to see all connections
  useEffect(() => {
    console.log('useGroupScores - Friends:', friends.map(f => ({ id: f.id, name: f.name })));
  }, [friends]);
  
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
        
        // Log the player IDs of the scores
        if (scores.length > 0) {
          const uniquePlayerIds = [...new Set(scores.map(s => s.playerId))];
          console.log(`Scores from ${uniquePlayerIds.length} unique players:`, uniquePlayerIds);
          
          // Log friend IDs to compare
          const friendIds = friends.map(f => f.id);
          console.log(`Current friend IDs (${friendIds.length}):`, friendIds);
          
          // Check overlap
          const friendScores = scores.filter(s => friendIds.includes(s.playerId));
          console.log(`Found ${friendScores.length} scores from friends`);
          
          // Log scores that are from friends
          friendScores.forEach(score => {
            const friend = friends.find(f => f.id === score.playerId);
            console.log(`Friend score: ${friend?.name} (${score.playerId}), value: ${score.value}`);
          });
          
          // Log scores that are not from friends
          const nonFriendScores = scores.filter(s => !friendIds.includes(s.playerId) && s.playerId !== user?.id);
          console.log(`Found ${nonFriendScores.length} scores from non-friends`);
          nonFriendScores.forEach(score => {
            console.log(`Non-friend score: ${score.playerId}, value: ${score.value}`);
          });
        }
        
        setAllTodaysScores(scores);
      } catch (error) {
        console.error('Error fetching all today\'s scores:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllTodaysScores();
  }, [gameId, friends, user?.id]);
  
  // Process the data whenever dependencies change
  useEffect(() => {
    if (!user || !gameId) {
      setGroupPerformanceData([]);
      setAllFriendsData(null);
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
      
      // Process all friends' performance data regardless of group membership
      const allFriendsMembers: GroupMemberPerformance[] = friends.map(friend => {
        // Look for each friend's score in allTodaysScores
        const friendScore = allTodaysScores.find(score => 
          score.playerId === friend.id && score.gameId === gameId
        );
        
        const hasPlayed = !!friendScore;
        const score = hasPlayed ? friendScore.value : null;
        
        console.log(`All Friends View: ${friend.name} (${friend.id}) has played: ${hasPlayed}, score: ${score || 'none'}`);
        
        return {
          playerId: friend.id,
          playerName: friend.name,
          hasPlayed: hasPlayed,
          score: score
        };
      });
      
      // Set all friends performance data
      setAllFriendsData({
        members: allFriendsMembers,
        currentUserHasPlayed: userHasPlayed,
        currentUserScore: userScore
      });
      
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
        // Debug the group members
        console.log(`Processing group: ${group.name} with ${group.members?.length || 0} members`);
        if (group.members) {
          group.members.forEach(member => {
            console.log(`Group member: ${member.name} (${member.id})`);
          });
        }
        
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
  
  return { isLoading, groupPerformanceData, allFriendsData, refreshFriends };
};
