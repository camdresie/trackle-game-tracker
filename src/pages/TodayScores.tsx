import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { useHomeData } from '@/hooks/useHomeData';
import { useGroupScores } from '@/hooks/useGroupScores';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { useFriendsList } from '@/hooks/useFriendsList';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GamepadIcon, 
  Users, 
  Trophy, 
  ChevronRight, 
  CalendarDays, 
  MessageCircle, 
  InfoIcon, 
  Share2,
  Loader2,
  RefreshCw,
  User,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { games } from '@/utils/gameData';
import GroupMessagesModal from '@/components/messages/GroupMessagesModal';
import GroupInvitationsList from '@/components/connections/GroupInvitationsList';
import { getFormattedTodayInEasternTime } from '@/utils/dateUtils';
import GroupScoresShare from '@/components/groups/GroupScoresShare';
import GameDropdownSelector from '@/components/game/GameDropdownSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import ConnectionsModal from '@/components/ConnectionsModal';
import { toast } from 'sonner';
import { FixedSizeList as List } from 'react-window';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { isLowerScoreBetter } from '@/utils/gameData';
import { isDevelopment } from '@/utils/environment';

// --- Define necessary interfaces locally ---
interface GroupMemberPerformance {
  playerId: string;
  playerName: string;
  hasPlayed: boolean;
  score: number | null;
}

interface GroupPerformance {
  groupId: string;
  groupName: string;
  currentUserHasPlayed: boolean;
  currentUserScore: number | null;
  members: GroupMemberPerformance[];
}
// --- End interface definitions ---

// Define a consistent interface for group members
interface GroupMember {
  playerId: string;
  playerName: string;
  hasPlayed: boolean;
  score?: number | null;
  isCurrentUser?: boolean;
}

// Define this constant for friend item height
const FRIEND_ITEM_HEIGHT = 60; // Height to match By Group styling with p-3 padding

// Component to render the virtualized friends list - moved outside the main component and memoized
const FriendListVirtualized = memo(({ 
  friends, 
  selectedGame
}: { 
  friends: GroupMember[], 
  selectedGame: any
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef);
  
  // Calculate isLowerBetter inside the component
  const isLowerBetter = useMemo(() => isLowerScoreBetter(selectedGame?.id || ''), [selectedGame]);
  
  // Sort the friends list
  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      // First sort by played status - people who played come first
      if (a.hasPlayed && a.score !== null && a.score !== undefined && (!b.hasPlayed || b.score === null || b.score === undefined)) return -1;
      if ((!a.hasPlayed || a.score === null || a.score === undefined) && b.hasPlayed && b.score !== null && b.score !== undefined) return 1;
      
      // If both have played, sort by score
      if (a.hasPlayed && a.score !== null && a.score !== undefined && b.hasPlayed && b.score !== null && b.score !== undefined) {
        // Make sure we're comparing numbers
        const scoreA = typeof a.score === 'number' ? a.score : (isLowerBetter ? 999 : 0);
        const scoreB = typeof b.score === 'number' ? b.score : (isLowerBetter ? 999 : 0);
        
        return isLowerBetter ? scoreA - scoreB : scoreB - scoreA;
      }
      
      // If neither has played, keep original order
      return 0;
    });
  }, [friends, isLowerBetter]);
  
  // Format score values based on game type
  const formatScoreValue = useCallback((score: number | null | undefined, gameId: string) => {
    if (score === null || score === undefined) return '-';
    
    // Specific formatting for time-based games (MM:SS)
    if (gameId === 'mini-crossword') {
        if (score <= 0) return '0:00';
        const minutes = Math.floor(score / 60);
        const seconds = score % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // For games with special formatting like Quordle
    if (gameId === 'quordle') {
      return score.toString();
    }
    
    return score.toString();
  }, []);
  
  // Row renderer for the virtualized list
  const FriendRow = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const person = sortedFriends[index];
    
    // Use the locally defined isLowerBetter
    const playersWithScores = sortedFriends.filter(p => p.hasPlayed && p.score !== null && p.score !== undefined);
    
    // Find the top score
    let topScore = null;
    if (playersWithScores.length > 0) {
      const sortedByScore = [...playersWithScores].sort((a, b) => {
        const scoreA = typeof a.score === 'number' ? a.score : (isLowerBetter ? 999 : 0);
        const scoreB = typeof b.score === 'number' ? b.score : (isLowerBetter ? 999 : 0);
        return isLowerBetter ? scoreA - scoreB : scoreB - scoreA;
      });
      topScore = sortedByScore[0].score;
    }
    
    // Check if this person has the top score and if there are ties
    const hasTopScore = person.hasPlayed && person.score !== null && person.score !== undefined && person.score === topScore;
    const tiedPlayers = playersWithScores.filter(p => p.score === topScore);
    const isTied = tiedPlayers.length > 1;
    
    // Check if this is the first item in the sorted list (for Top score badge)
    const isFirst = index === 0 && person.hasPlayed;
    const hasTiedTopScore = hasTopScore && isTied;
    
    return (
      <div style={style} className="px-1 py-1">
        <div 
          className={`flex items-center justify-between p-3 rounded-lg ${
            person.isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50"
          } ${hasTopScore ? "border border-accent/20" : ""}`}
        >
          <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
            {hasTopScore && (
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
            <div className="font-medium truncate">
              {person.playerName}
            </div>
            {isFirst && !isTied && (
              <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                Top score
              </span>
            )}
            {hasTiedTopScore && (
              <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                Tied
              </span>
            )}
          </div>
          {person.hasPlayed ? (
            <span className="font-semibold">{formatScoreValue(person.score, selectedGame?.id)}</span>
          ) : (
            <span className="text-sm text-muted-foreground">No score yet</span>
          )}
        </div>
      </div>
    );
  }, [sortedFriends, formatScoreValue, selectedGame?.id, isLowerBetter]);
  
  // Set display name for debugging
  FriendListVirtualized.displayName = 'FriendListVirtualized';

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No friends found</p>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} style={{ height: '300px' }}>
      {width && (
        <List
          height={300}
          width={width}
          itemCount={sortedFriends.length}
          itemSize={FRIEND_ITEM_HEIGHT}
        >
          {FriendRow}
        </List>
      )}
    </div>
  );
});

// Define interfaces
interface ProcessedGroupForRender extends GroupPerformance { // Extend original type
  sortedMembers: GroupMember[];
}

const TodayScores = () => {
  const { user, profile } = useAuth();
  const {
    isLoading: isHomeDataLoading,
    gamesList,
    todaysGames,
    selectedGame,
    setSelectedGame,
  } = useHomeData();
  
  // Sort the games list alphabetically for the dropdown
  const sortedGames = useMemo(() => 
    [...gamesList].sort((a, b) => a.name.localeCompare(b.name)), 
  [gamesList]);
  
  // Get friends list using the appropriate hook
  const { friends } = useFriendsList();
  
  // Changed default active tab to 'friends' instead of 'groups'
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');
  const [showMessages, setShowMessages] = useState(false);
  const [selectedGroupForMessages, setSelectedGroupForMessages] = useState<{id: string, name: string} | null>(null);
  const isMobile = useIsMobile();
  
  
  // Get group invitations
  const { 
    invitations, 
    isLoading: isLoadingInvitations,
    acceptInvitation,
    declineInvitation 
  } = useGroupInvitations();
  
  // Set default game to Wordle on component mount
  useEffect(() => {
    if (!selectedGame && gamesList.length > 0) {
      const wordleGame = gamesList.find(g => g.id === 'wordle') || gamesList[0];
      setSelectedGame(wordleGame);
    }
  }, [gamesList, selectedGame, setSelectedGame]);
  
  // Fetch group performance data for selected game
  const { isLoading, groupPerformanceData, allFriendsData, refreshFriends } = useGroupScores(
    selectedGame?.id || null,
    todaysGames
  );
  
  // Handler for game selection 
  const handleGameSelect = useCallback((gameId: string) => {
    const game = sortedGames.find(g => g.id === gameId) || null;
    setSelectedGame(game);
  }, [sortedGames, setSelectedGame]);

  // Functions to handle opening modals with useCallback
  const handleOpenMessages = useCallback((groupId: string, groupName: string) => {
    setSelectedGroupForMessages({ id: groupId, name: groupName });
    setShowMessages(true);
  }, []);
  
  
  // Get today's date in Eastern Time for consistency
  const today = getFormattedTodayInEasternTime();
  
  // Format score utility function for TodayScores page
  const formatScoreValue = useCallback((score: number | null | undefined, gameId: string | undefined) => {
    if (score === null || score === undefined) return '-';
    if (!gameId) return score.toString(); // Return raw score if gameId is missing

    // Specific formatting for time-based games (MM:SS)
    if (gameId === 'mini-crossword') {
        if (score <= 0) return '0:00';
        const minutes = Math.floor(score / 60);
        const seconds = score % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Add other game-specific formatting here if needed
    
    return score.toString();
  }, []);

  // Helper function to determine the leading player in a group
  const getLeadingPlayerInGroup = useCallback((group: any) => {
    if (!group || !group.members || group.members.length === 0) return null;
    
    // Filter to only players who have played
    const playersWithScores = [
      // Include current user if they've played
      ...(group.currentUserHasPlayed ? [{
        playerId: 'currentUser', 
        playerName: 'You',
        score: group.currentUserScore,
        isCurrentUser: true
      }] : []),
      // Include all members who have played
      ...group.members.filter((m: any) => m.hasPlayed && m.score !== null)
    ];
    
    if (playersWithScores.length === 0) return null;
    
    // Calculate isLowerBetter inside this function
    const isLowerBetter = isLowerScoreBetter(selectedGame?.id || '');
    
    // Sort based on game type (lower or higher is better)
    const sorted = [...playersWithScores].sort((a, b) => {
      if (isLowerBetter) {
        return (a.score || 999) - (b.score || 999);
      } else {
        return (b.score || 0) - (a.score || 0);
      }
    });
    
    // If there are multiple players with the same top score, they are tied
    const topScore = sorted[0].score;
    const tiedPlayers = sorted.filter(player => player.score === topScore);
    
    // Return an object with the leading player(s) and whether there's a tie
    return {
      leaders: tiedPlayers,
      isTied: tiedPlayers.length > 1
    };
  }, [selectedGame]);
  
  // Convert member data to GroupMemberScore format
  const convertToGroupMemberScores = useCallback((members: any[]) => {
    // Ensure members is an array before mapping
    if (!Array.isArray(members)) {
        console.warn("convertToGroupMemberScores received non-array members:", members);
        return [];
    }
    return members.map(member => ({
      playerId: member.playerId, // Include playerId
      playerName: member.playerName,
      score: member.score,
      hasPlayed: member.hasPlayed
    }));
  }, []);

  // Create a combined list for all friends including those without scores
  // Use the new allFriendsData that comes directly from the hook
  const getAllFriendsList = useMemo(() => {
    // Start with an empty list
    const allFriends: GroupMember[] = [];
    
    // Add current user first if they exist and we have allFriendsData
    if (user && allFriendsData) {
      allFriends.push({
        playerId: user.id,
        playerName: 'You',
        hasPlayed: allFriendsData.currentUserHasPlayed,
        score: allFriendsData.currentUserScore,
        isCurrentUser: true
      });
      
      // Add all friends from the allFriendsData
      allFriendsData.members.forEach(member => {
        allFriends.push({
          playerId: member.playerId,
          playerName: member.playerName,
          hasPlayed: member.hasPlayed,
          score: member.score,
          isCurrentUser: false
        });
      });
    } 
    // Fallback to the old method if we don't have allFriendsData
    else if (user) {
      // First add the current user
      const hasPlayed = groupPerformanceData.some(g => g.currentUserHasPlayed);
      const userScore = hasPlayed ? 
        groupPerformanceData.find(g => g.currentUserHasPlayed)?.currentUserScore : null;
        
      allFriends.push({
        playerId: user.id,
        playerName: 'You',
        hasPlayed: hasPlayed,
        score: userScore,
        isCurrentUser: true
      });
      
      // Then add all the user's friends
      friends.forEach(friend => {
        // Skip if this is the current user (already added)
        if (friend.id === user.id) return;
        
        // Find this friend's data in any group
        const friendData = groupPerformanceData.flatMap(group => group.members)
          .find(member => member?.playerId === friend.id);
          
        allFriends.push({
          playerId: friend.id,
          playerName: friend.name,
          hasPlayed: friendData?.hasPlayed || false,
          score: friendData?.score || null,
          isCurrentUser: false
        });
      });
    }
    
    return allFriends;
  }, [user, allFriendsData, groupPerformanceData, friends]);

  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const [activeConnectionsTab, setActiveConnectionsTab] = useState<string>('friends');
  
  // Handle opening connections modal with specific tab selected
  const handleOpenConnectionsModal = useCallback((tab: string = 'friends') => {
    setActiveConnectionsTab(tab);
    setConnectionsModalOpen(true);
  }, []);
  
  // Function to handle manual refresh
  const handleManualRefresh = useCallback(async () => {
    try {
      if (refreshFriends) {
        await refreshFriends();
        toast.success("Friend data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing friend data:", error);
      toast.error("Failed to refresh data");
    }
  }, [refreshFriends]);
  
  // Use the allFriendsData for the GroupScoresShare component in the All Friends tab
  const getAllFriendsForScoreShare = useCallback(() => {
    if (allFriendsData) {
      return {
        groupName: "All Friends",
        members: allFriendsData.members.map(m => ({
          playerId: m.playerId, // Include playerId
          playerName: m.playerName,
          score: m.score,
          hasPlayed: m.hasPlayed
        })),
        currentUserName: profile?.full_name || profile?.username || 'You',
        currentUserScore: allFriendsData.currentUserScore,
        currentUserHasPlayed: allFriendsData.currentUserHasPlayed,
        allFriends: true
      };
    } else {
      // Create from the memoized list
      return {
        groupName: "All Friends",
        members: getAllFriendsList
          .filter(f => !f.isCurrentUser)
          .map(m => ({
            playerId: m.playerId, // Include playerId
            playerName: m.playerName,
            score: m.score,
            hasPlayed: m.hasPlayed
          })),
        currentUserName: profile?.full_name || profile?.username || 'You',
        currentUserScore: getAllFriendsList.find(m => m.isCurrentUser)?.score || null,
        currentUserHasPlayed: getAllFriendsList.find(m => m.isCurrentUser)?.hasPlayed || false,
        allFriends: true
      };
    }
  }, [allFriendsData, getAllFriendsList, profile?.full_name, profile?.username]);

  // --- Pre-process group data for rendering --- 
  const processedGroupsForRender = useMemo<ProcessedGroupForRender[]>(() => {
    if (!groupPerformanceData) return [];

    return groupPerformanceData.map((group) => {
      const isLowerBetter = isLowerScoreBetter(selectedGame?.id || '');

      // Create allMembers array including current user and members
      const allMembers: GroupMember[] = [];
                    
      // If the current user has played, add them to the list first
      if (group.currentUserHasPlayed && group.currentUserScore !== null && group.currentUserScore !== undefined) {
        allMembers.push({
          playerId: 'currentUser',
          playerName: profile?.full_name || profile?.username || 'You',
          score: group.currentUserScore,
          hasPlayed: true,
          isCurrentUser: true
        });
      } else {
        allMembers.push({
          playerId: 'currentUser',
          playerName: profile?.full_name || profile?.username || 'You',
          score: null,
          hasPlayed: false,
          isCurrentUser: true
        });
      }
                      
      // Then add the other members
      group.members.forEach(m => {
        if (m.playerId === user?.id) return;
        allMembers.push({
          playerId: m.playerId,
          playerName: m.playerName,
          score: m.hasPlayed ? m.score : null, 
          hasPlayed: m.hasPlayed, 
          isCurrentUser: false
        });
      });
                      
      // Sort members directly: played first, then by score, then unplayed
      const sortedMembers = [...allMembers].sort((a, b) => {
        const aPlayed = a.hasPlayed;
        const bPlayed = b.hasPlayed;
        if (aPlayed && !bPlayed) return -1;
        if (!aPlayed && bPlayed) return 1;
        if (aPlayed && bPlayed) {
          const scoreA = typeof a.score === 'number' ? a.score : (isLowerBetter ? Infinity : -Infinity);
          const scoreB = typeof b.score === 'number' ? b.score : (isLowerBetter ? Infinity : -Infinity);
          return isLowerBetter ? scoreA - scoreB : scoreB - scoreA;
        }
        return a.playerName.localeCompare(b.playerName); 
      });

      // Return the original group data spread, plus the sortedMembers
      return {
        ...group, // Include original group data (groupId, name, etc.)
        sortedMembers: sortedMembers // Add the calculated sorted members
      };
    });
  }, [groupPerformanceData, selectedGame, profile, user]); // Dependencies

  // Memoize the all friends tab content
  const allFriendsTabContent = useMemo(() => (
    <TabsContent value="friends" className="space-y-6">
      <GameDropdownSelector
        selectedGame={selectedGame?.id || ''}
        games={sortedGames}
        onSelectGame={handleGameSelect}
        className="mb-4"
        showOnDesktop={true}
      />
      <Card className="shadow-md">
        <div className="p-4 bg-accent/40 rounded-t-lg border-b border-accent">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold leading-none">All Friends</h3>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <div className="flex flex-col">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="truncate">All Friends {selectedGame?.name || ''} Scores</span>
                </h3>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <GroupScoresShare
                  groupName="All Friends"
                  gameName={selectedGame?.name || ""}
                  gameId={selectedGame?.id}
                  gameColor={selectedGame?.color || ""}
                  members={getAllFriendsForScoreShare().members}
                  currentUserId={user?.id}
                  currentUserName={profile?.username || ""}
                  currentUserScore={getAllFriendsForScoreShare().currentUserScore}
                  currentUserHasPlayed={getAllFriendsForScoreShare().currentUserHasPlayed}
                  useActualUsername={true}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center justify-center gap-1"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className={cn(isMobile ? "sr-only" : "")}>Share</span>
                  </Button>
                </GroupScoresShare>
              </div>
            </div>
            
            {/* Friends scores list - Modified to use virtualization */}
            <div className="space-y-1 mt-2">
              <FriendListVirtualized 
                friends={getAllFriendsList}
                selectedGame={selectedGame}
              />
            </div>
          </div>
        </div>
      </Card>
    </TabsContent>
  ), [
    selectedGame, 
    getAllFriendsForScoreShare, 
    profile?.username, 
    getAllFriendsList,
    handleGameSelect,
    sortedGames
  ]);

  return (
    
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-28 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Today's Scores</h1>
            <p className="text-muted-foreground">{today}</p>
          </div>
        </div>
        
        
        
        {/* Time zone message */}
        <div className="mb-6 bg-muted/60 rounded-lg p-3 flex items-center gap-2 text-sm">
          <InfoIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-muted-foreground">
            Today's scores reset at midnight Eastern Time (ET).
          </p>
        </div>
        
        {/* Group Invitations - Show only if there are any */}
        {invitations && invitations.length > 0 && (
          <GroupInvitationsList 
            invitations={invitations}
            isLoading={isLoadingInvitations}
            onAccept={acceptInvitation}
            onDecline={declineInvitation}
          />
        )}
        
        {!selectedGame ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <GamepadIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a Game</h2>
            <p className="text-muted-foreground">
              Choose a game from the options above to see how you compare with your friends.
            </p>
          </Card>
        ) : isLoading || isHomeDataLoading ? (
          <div className="space-y-4">
            <div className="h-20 bg-muted/30 animate-pulse rounded-lg"></div>
            <div className="h-40 bg-muted/30 animate-pulse rounded-lg"></div>
            <div className="h-40 bg-muted/30 animate-pulse rounded-lg"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="groups" className="w-full">
              <TabsList className="inline-flex sm:inline-flex w-full sm:w-auto grid sm:grid-cols-none grid-cols-2 h-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <TabsTrigger value="groups" className="inline-flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  By Group
                </TabsTrigger>
                <TabsTrigger value="friends" className="inline-flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  All Friends
                </TabsTrigger>
              </TabsList>
              
              {/* By Group tab content */}
              <TabsContent value="groups" className="space-y-6">
                <GameDropdownSelector
                  selectedGame={selectedGame?.id || ''}
                  games={sortedGames}
                  onSelectGame={handleGameSelect}
                  className="mb-4"
                  showOnDesktop={true}
                />
                {/* === Loading/Empty/Data Logic Start === */}
                {isLoading ? (
                  // Show Skeleton loaders while loading
                  <div className="space-y-6">
                    <Card className="shadow-md">
                      <div className="p-4 bg-muted/40 rounded-t-lg border-b border-muted">
                        <Skeleton className="h-6 w-3/5" />
                      </div>
                      <div className="px-3 py-2 space-y-3">
                        <Skeleton className="h-5 w-4/5 mb-3" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                        <div className="space-y-2 mt-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      </div>
                    </Card>
                    {/* Add more skeletons if needed for multiple groups */}
                  </div>
                ) : processedGroupsForRender && processedGroupsForRender.length > 0 ? (
                  // Render groups using the pre-processed memoized data
                  <div className="space-y-6">
                    {processedGroupsForRender.map((group) => { // Map over processed data
                      const leadingPlayer = getLeadingPlayerInGroup(group); // Can still calculate this here
                      const groupMemberScores = convertToGroupMemberScores(group.members);
                      const isPendingMember = invitations.find(inv => inv.groupId === group.groupId && inv.status === 'pending');
                    
                      // NOTE: No need to calculate allMembers/sortedMembers again here

                      return (
                        <Card key={group.groupId} className="shadow-md">
                          <div className="p-4 bg-accent/40 rounded-t-lg border-b border-accent">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold leading-none">{group.groupName}</h3>
                            </div>
                          </div>
                          
                          {/* Show pending message if user is pending */}
                          {isPendingMember && (
                            <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-center">
                                <InfoIcon className="h-4 w-4 text-yellow-500 mr-2" />
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                  Your invitation to this group is pending. You'll see member scores once accepted.
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="px-3 py-2">
                            {/* Rest of group display content */}
                            <div className="flex flex-col">
                              {/* Group header with title */}
                              <>
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between">
                                      <h3 className="font-semibold text-xl flex items-center gap-2 min-w-0">
                                        <Users className="w-5 h-5 text-accent flex-shrink-0" />
                                        <span className="break-words">{group.groupName} {selectedGame?.name || ''} Scores</span>
                                      </h3>
                                      {/* Only show Leading badge here on mobile, not in the score section below */}
                                      {leadingPlayer?.leaders.some(p => p.isCurrentUser) && (
                                        <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
                                          <Trophy className="w-3 h-3 mr-1" /> Leading
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Updated button styling to match the app's style */}
                                    <div className="flex items-center gap-2 mt-3">
                                      <GroupScoresShare
                                        groupName={group.groupName}
                                        gameName={selectedGame?.name || ""}
                                        gameId={selectedGame?.id}
                                        gameColor={selectedGame?.color || ""}
                                        members={groupMemberScores}
                                        currentUserId={user?.id}
                                        currentUserName={profile?.username || ""}
                                        currentUserScore={group.currentUserScore}
                                        currentUserHasPlayed={group.currentUserHasPlayed}
                                        useActualUsername={true}
                                      >
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="flex items-center justify-center gap-1"
                                        >
                                          <Share2 className="w-4 h-4" />
                                          <span className={cn(isMobile ? "sr-only" : "")}>Share</span>
                                        </Button>
                                      </GroupScoresShare>
                                      
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenMessages(group.groupId, group.groupName)}
                                        className="flex items-center justify-center gap-1"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                        <span className={cn(isMobile ? "sr-only" : "")}>Message</span>
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Group members with scores */}
                                  <div className="space-y-1 mt-2">
                                    {group.sortedMembers.length > 0 ? ( // Use pre-calculated list
                                      group.sortedMembers.map((member, i) => { // Map over pre-calculated list
                                        const isCurrentUser = member.isCurrentUser;
                                        return (
                                          <div 
                                            key={`${member.playerId}-${i}`}
                                            className={cn(
                                              "flex items-center justify-between p-3 rounded-lg",
                                              isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50",
                                              !member.hasPlayed ? "text-muted-foreground" : "" 
                                            )}
                                          >
                                            <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                                              <span className="font-medium truncate">
                                                {member.playerName}
                                              </span>
                                            </div>
                                            
                                            {/* Use hasPlayed flag directly from the 'member' object */}
                                            {member.hasPlayed ? (
                                              <span className="font-semibold">
                                                {formatScoreValue(member.score, selectedGame?.id)}
                                              </span>
                                            ) : (
                                              <span className="text-sm text-muted-foreground">
                                                No score yet
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="text-center py-3 text-muted-foreground">
                                        <p>No one has played {selectedGame?.name} today</p>
                                      </div>
                                    )}
                                  </div>
                                </>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                    
                    <div className="flex justify-center">
                      <Button
                        onClick={() => handleOpenConnectionsModal('groups')}
                        variant="outline"
                        className="gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Manage Groups
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Render "No Groups Yet" ONLY if loading is done AND data is empty
                  <Card className="p-8 flex flex-col items-center justify-center text-center">
                    <Users className="w-12 h-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Groups Yet</h2>
                    <p className="text-muted-foreground mb-4">
                      Create groups to see how you and your friends compare in daily games.
                      Share scores, compete, and chat with your friends in groups!
                    </p>
                    <Button 
                      onClick={() => handleOpenConnectionsModal('groups')}
                      variant="default"
                      className="gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Create Your First Group
                    </Button>
                  </Card>
                )}
                {/* === Loading/Empty/Data Logic End === */}
              </TabsContent>
              
              {/* All Friends tab content */}
              {allFriendsTabContent}
            </Tabs>
          </div>
        )}
      </main>
      
      {/* Group Messages Modal */}
      <GroupMessagesModal
        open={showMessages}
        onOpenChange={setShowMessages}
        groupId={selectedGroupForMessages?.id || ''}
        groupName={selectedGroupForMessages?.name || ''}
      />
      
      {/* Connections Modal for managing friends and groups */}
      <ConnectionsModal
        open={connectionsModalOpen}
        onOpenChange={setConnectionsModalOpen}
        currentPlayerId={user?.id || ''}
        defaultTab={activeConnectionsTab}
      />
    </div>
  );
};

export default TodayScores;
