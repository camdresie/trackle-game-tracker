
import React from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { games } from '@/utils/gameData';

interface LeaderboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFriendsOnly: boolean;
  setShowFriendsOnly: (show: boolean) => void;
  timeFilter: 'all' | 'today';
  setTimeFilter: (filter: 'all' | 'today') => void;
  selectedGame: string;
  setSelectedGame: (game: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

const LeaderboardFilters = ({
  searchTerm,
  setSearchTerm,
  showFriendsOnly,
  setShowFriendsOnly,
  timeFilter,
  setTimeFilter,
  selectedGame,
  setSelectedGame,
  sortBy,
  setSortBy
}: LeaderboardFiltersProps) => {
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
          <Switch
            id="friends-only"
            checked={showFriendsOnly}
            onCheckedChange={setShowFriendsOnly}
          />
          <label 
            htmlFor="friends-only" 
            className="text-sm cursor-pointer flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Friends</span>
          </label>
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
