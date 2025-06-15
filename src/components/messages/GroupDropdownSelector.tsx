import React, { useState, useEffect, memo, useRef } from 'react';
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
import { isDevelopment } from '@/utils/environment';

interface GroupDropdownSelectorProps {
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string, groupName: string) => void;
  className?: string;
  groups?: FriendGroup[]; // Make groups optional to support both usage patterns
  label?: string;
}

// Debug counter
let renderCount = 0;

// Wrap in memo to prevent unnecessary rerenders
const GroupDropdownSelector = memo(({ 
  selectedGroupId, 
  onSelectGroup,
  className = '',
  groups: externalGroups, // Rename to avoid conflicts
  label = "Select Group"
}: GroupDropdownSelectorProps) => {
  const thisRenderCount = ++renderCount;
  const componentId = useRef(`group-selector-${Math.random().toString(36).substr(2, 9)}`).current;
  
  
  const isMobile = useIsMobile();
  
  // Don't use internal groups here - only use if externally provided
  // This was causing a double data fetch that might contribute to re-render cycles
  // const { friendGroups: internalGroups } = useFriendGroups([]);
  
  const [selectedGroup, setSelectedGroup] = useState<FriendGroup | null>(null);
  
  // Use externally provided groups
  const groups = externalGroups || [];
  
  // Find the current group object
  useEffect(() => {
    if (!groups || !selectedGroupId) {
      setSelectedGroup(null);
      return;
    }
    
    const group = groups.find(g => g.id === selectedGroupId);
    if (group) {
      setSelectedGroup(group);
    } else {
      setSelectedGroup(null);
    }
  }, [selectedGroupId, groups]);
  
  // Log state changes
  useEffect(() => {
  }, [selectedGroup, componentId]);
  
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
}, (prevProps, nextProps) => {
  // Return true if props are equal and component should NOT re-render
  const sameSelectedId = prevProps.selectedGroupId === nextProps.selectedGroupId;
  const sameGroups = prevProps.groups?.length === nextProps.groups?.length && 
    prevProps.groups?.every((g, i) => nextProps.groups?.[i]?.id === g.id);
  
  return sameSelectedId && sameGroups;
});

// Add display name for debugging
GroupDropdownSelector.displayName = 'GroupDropdownSelector';

export default GroupDropdownSelector;
