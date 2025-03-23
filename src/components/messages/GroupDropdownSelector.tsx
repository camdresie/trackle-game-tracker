
import React, { useState, useEffect } from 'react';
import { ChevronDown, UsersRound } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
}

const GroupDropdownSelector = ({ 
  selectedGroupId, 
  onSelectGroup,
  className = '',
  groups: externalGroups // Rename to avoid conflicts
}: GroupDropdownSelectorProps) => {
  const isMobile = useIsMobile();
  const { friendGroups: internalGroups } = useFriendGroups();
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
            className="w-full justify-between border border-input"
          >
            <div className="flex items-center">
              <UsersRound className="w-4 h-4 mr-2" />
              <span>{selectedGroup?.name || "Select Group"}</span>
              {selectedGroup?.isJoinedGroup && (
                <Badge variant="outline" className="ml-2 bg-secondary/30">
                  Joined
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[200px]">
          {groups.map(group => (
            <DropdownMenuItem
              key={group.id}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleSelectGroup(group.id)}
            >
              <UsersRound className="w-4 h-4" />
              <span>{group.name}</span>
              {group.isJoinedGroup && (
                <Badge variant="outline" className="ml-1 bg-secondary/30 text-xs">
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
