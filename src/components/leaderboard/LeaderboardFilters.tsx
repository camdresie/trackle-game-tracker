
import React, { useState } from 'react';
import { Search, UserPlus, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
import { Player } from '@/utils/types';

interface LeaderboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFriendsOnly: boolean;
  setShowFriendsOnly: (show: boolean) => void;
  selectedFriendIds: string[];
  setSelectedFriendIds: (ids: string[]) => void;
  timeFilter: 'all' | 'today';
  setTimeFilter: (filter: 'all' | 'today') => void;
  selectedGame: string;
  setSelectedGame: (game: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  friendsList: Player[];
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
  friendsList
}: LeaderboardFiltersProps) => {
  const [friendsDropdownOpen, setFriendsDropdownOpen] = useState(false);

  // Handle selecting/deselecting all friends
  const handleAllFriendsToggle = () => {
    if (showFriendsOnly) {
      // If already showing all friends, turn off friends filter
      setShowFriendsOnly(false);
      setSelectedFriendIds([]);
    } else {
      // Show all friends
      setShowFriendsOnly(true);
      setSelectedFriendIds([]);
    }
  };

  // Handle selecting/deselecting a specific friend
  const handleFriendToggle = (friendId: string) => {
    setShowFriendsOnly(true);
    
    if (selectedFriendIds.includes(friendId)) {
      // Remove friend if already selected
      setSelectedFriendIds(selectedFriendIds.filter(id => id !== friendId));
    } else {
      // Add friend if not already selected
      setSelectedFriendIds([...selectedFriendIds, friendId]);
    }
  };

  // Get the label for the friends dropdown button
  const getFriendsButtonLabel = () => {
    if (!showFriendsOnly) return "All Players";
    if (selectedFriendIds.length === 0) return "All Friends";
    if (selectedFriendIds.length === 1) {
      const friend = friendsList.find(f => f.id === selectedFriendIds[0]);
      return friend ? friend.name : "1 Friend";
    }
    return `${selectedFriendIds.length} Friends`;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
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
                }}
              >
                All Players
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={showFriendsOnly && selectedFriendIds.length === 0}
                onCheckedChange={handleAllFriendsToggle}
              >
                All Friends
              </DropdownMenuCheckboxItem>
              
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
            onValueChange={(value) => setTimeFilter(value as 'all' | 'today')}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-auto">
          <Select 
            value={selectedGame} 
            onValueChange={setSelectedGame}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Game" />
            </SelectTrigger>
            <SelectContent>
              {games.map(game => (
                <SelectItem key={game.id} value={game.id}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-auto">
          <Select 
            value={sortBy} 
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalScore">Total Score</SelectItem>
              <SelectItem value="bestScore">Best Score</SelectItem>
              <SelectItem value="totalGames">Games Played</SelectItem>
              <SelectItem value="averageScore">Average Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardFilters;
