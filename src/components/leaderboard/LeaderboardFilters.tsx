import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, GamepadIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { games } from '@/utils/gameData';
import { Player, FriendGroup } from '@/utils/types';
import { SortByOption, TimeFilter } from '@/types/leaderboard';
import GameDropdownSelector from '@/components/game/GameDropdownSelector';
import { useIsMobile } from '@/hooks/use-mobile';

interface LeaderboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFriendsOnly: boolean;
  setShowFriendsOnly: (show: boolean) => void;
  selectedFriendIds: string[];
  setSelectedFriendIds: (ids: string[]) => void;
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  selectedGame: string;
  setSelectedGame: (game: string) => void;
  sortBy: SortByOption;
  setSortBy: (sort: SortByOption) => void;
  friendsList: Player[];
  friendGroups?: FriendGroup[];
  selectedGroupId?: string | null;
  setSelectedGroupId?: (groupId: string | null) => void;
}

const LeaderboardFilters = ({
  searchTerm,
  setSearchTerm,
  showFriendsOnly,
  setShowFriendsOnly,
  selectedFriendIds,
  setSelectedFriendIds,
  timeFilter,
  setTimeFilter,
  selectedGame,
  setSelectedGame,
  sortBy,
  setSortBy,
  friendsList,
  friendGroups = [],
  selectedGroupId = null,
  setSelectedGroupId = () => {}
}: LeaderboardFiltersProps) => {
  const [friendsDropdownOpen, setFriendsDropdownOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Split games into two rows
  const firstRowGames = games.slice(0, Math.ceil(games.length / 2));
  const secondRowGames = games.slice(Math.ceil(games.length / 2));

  // Handle selecting/deselecting all friends
  const handleAllFriendsToggle = () => {
    if (showFriendsOnly) {
      // If already showing all friends, turn off friends filter
      setShowFriendsOnly(false);
      setSelectedFriendIds([]);
      setSelectedGroupId(null);
    } else {
      // Show all friends
      setShowFriendsOnly(true);
      setSelectedFriendIds([]);
      setSelectedGroupId(null);
    }
  };

  // Handle selecting/deselecting a specific friend
  const handleFriendToggle = (friendId: string) => {
    setShowFriendsOnly(true);
    setSelectedGroupId(null);
    
    if (selectedFriendIds.includes(friendId)) {
      // Remove friend if already selected
      setSelectedFriendIds(selectedFriendIds.filter(id => id !== friendId));
    } else {
      // Add friend if not already selected
      setSelectedFriendIds([...selectedFriendIds, friendId]);
    }
  };

  // Handle selecting a group
  const handleGroupSelect = (groupId: string) => {
    setShowFriendsOnly(true);
    setSelectedFriendIds([]);
    setSelectedGroupId(groupId);
  };

  // Get the label for the friends dropdown button
  const getFriendsButtonLabel = () => {
    if (!showFriendsOnly) return "All Players";
    
    if (selectedGroupId) {
      const group = friendGroups.find(g => g.id === selectedGroupId);
      return group ? `Group: ${group.name}` : "Selected Group";
    }
    
    if (selectedFriendIds.length === 0) return "All Friends";
    if (selectedFriendIds.length === 1) {
      const friend = friendsList.find(f => f.id === selectedFriendIds[0]);
      return friend ? friend.name : "1 Friend";
    }
    return `${selectedFriendIds.length} Friends`;
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Game Dropdown for Mobile */}
      <GameDropdownSelector
        selectedGame={selectedGame}
        games={games}
        onSelectGame={setSelectedGame}
        className="mb-2"
      />
      
      {/* Game Selector Pills - Only show on desktop */}
      {!isMobile && (
        <div className="w-full">
          {/* First Row */}
          <div className="flex flex-wrap gap-2 mb-2">
            {firstRowGames.map(game => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  selectedGame === game.id 
                    ? `${game.color.replace('bg-', 'bg-')} text-white hover:bg-opacity-90`
                    : 'border border-muted hover:bg-muted/10'
                }`}
              >
                <GamepadIcon className="w-3.5 h-3.5" />
                <span>{game.name}</span>
              </button>
            ))}
          </div>
          
          {/* Second Row */}
          <div className="flex flex-wrap gap-2">
            {secondRowGames.map(game => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  selectedGame === game.id 
                    ? `${game.color.replace('bg-', 'bg-')} text-white hover:bg-opacity-90`
                    : 'border border-muted hover:bg-muted/10'
                }`}
              >
                <GamepadIcon className="w-3.5 h-3.5" />
                <span>{game.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search players..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu open={friendsDropdownOpen} onOpenChange={setFriendsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`flex items-center gap-1 ${showFriendsOnly ? 'bg-primary/10' : ''}`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">{getFriendsButtonLabel()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Filter By Friends</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuCheckboxItem
                  checked={!showFriendsOnly}
                  onCheckedChange={() => {
                    setShowFriendsOnly(false);
                    setSelectedFriendIds([]);
                    setSelectedGroupId(null);
                  }}
                >
                  All Players
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={showFriendsOnly && selectedFriendIds.length === 0 && !selectedGroupId}
                  onCheckedChange={handleAllFriendsToggle}
                >
                  All Friends
                </DropdownMenuCheckboxItem>
                
                {friendGroups.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Friend Groups</DropdownMenuLabel>
                      {friendGroups.map(group => (
                        <DropdownMenuCheckboxItem
                          key={group.id}
                          checked={selectedGroupId === group.id}
                          onCheckedChange={() => handleGroupSelect(group.id)}
                        >
                          <Users className="w-3 h-3 mr-2 inline" />
                          {group.name} ({group.members?.length || 0})
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuGroup>
                  </>
                )}
                
                {friendsList.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Select Specific Friends</DropdownMenuLabel>
                      {friendsList.map(friend => (
                        <DropdownMenuCheckboxItem
                          key={friend.id}
                          checked={selectedFriendIds.includes(friend.id)}
                          onCheckedChange={() => handleFriendToggle(friend.id)}
                        >
                          {friend.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <Select 
              value={timeFilter} 
              onValueChange={(value) => setTimeFilter(value as TimeFilter)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today Only</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <Select 
              value={sortBy} 
              onValueChange={(value) => setSortBy(value as SortByOption)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {timeFilter === 'today' ? (
                  <SelectItem value="totalScore">Today's Score</SelectItem>
                ) : (
                  <>
                    <SelectItem value="averageScore">Average Score</SelectItem>
                    <SelectItem value="bestScore">Best Score</SelectItem>
                    <SelectItem value="totalGames">Games Played</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardFilters;
