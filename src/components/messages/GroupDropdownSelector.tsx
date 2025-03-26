
import React, { useState, useEffect } from 'react';
import { ChevronDown, UsersRound } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FriendGroup } from '@/utils/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { useFriendGroups } from '@/hooks/useFriendGroups';

interface GroupDropdownSelectorProps {
  selectedGroupId: string;
  onSelectGroup: (groupId: string, groupName: string) => void;
  className?: string;
  groups?: FriendGroup[]; // Make groups optional to support both usage patterns
  label?: string;
}

const GroupDropdownSelector = ({ 
  selectedGroupId, 
  onSelectGroup,
  className = '',
  groups: externalGroups, // Rename to avoid conflicts
  label = "Select Group"
}: GroupDropdownSelectorProps) => {
  const isMobile = useIsMobile();
  
  // Pass an empty array to useFriendGroups as required by the hook
  const { friendGroups: internalGroups } = useFriendGroups([]);
  
  const [selectedGroup, setSelectedGroup] = useState<FriendGroup | null>(null);
  
  // Use externally provided groups if available, otherwise use internal groups from hook
  const groups = externalGroups || internalGroups;
  
  // Find the current group object
  useEffect(() => {
    if (groups && selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      setSelectedGroup(group || null);
    } else {
      setSelectedGroup(null);
    }
  }, [selectedGroupId, groups]);
  
  const handleSelectGroup = (groupId: string) => {
    const group = groups?.find(g => g.id === groupId);
    if (group) {
      onSelectGroup(group.id, group.name);
    }
  };
  
  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number = 20) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  if (!groups || groups.length === 0) {
    return (
      <Button 
        variant="outline" 
        className={`w-full justify-between border border-input ${className}`}
        disabled
      >
        <div className="flex items-center">
          <UsersRound className="w-4 h-4 mr-2" />
          <span>No groups available</span>
        </div>
      </Button>
    );
  }
  
  return (
    <div className={`w-full ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between border border-input bg-background"
            size="lg"
          >
            <div className="flex items-center truncate">
              <UsersRound className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{selectedGroup ? truncateText(selectedGroup.name, 30) : label}</span>
              {selectedGroup?.isJoinedGroup && (
                <Badge variant="outline" className="ml-2 bg-secondary/30 flex-shrink-0">
                  Joined
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[240px]" align="start">
          <DropdownMenuLabel>Message Group</DropdownMenuLabel>
          {groups.map(group => (
            <DropdownMenuItem
              key={group.id}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleSelectGroup(group.id)}
            >
              <UsersRound className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{group.name}</span>
              {group.isJoinedGroup && (
                <Badge variant="outline" className="ml-1 bg-secondary/30 text-xs flex-shrink-0">
                  Joined
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default GroupDropdownSelector;
