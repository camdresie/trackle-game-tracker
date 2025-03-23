
import React from 'react';
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

interface GroupDropdownSelectorProps {
  selectedGroupId: string | null;
  groups: FriendGroup[];
  onSelectGroup: (groupId: string) => void;
  className?: string;
}

const GroupDropdownSelector = ({ 
  selectedGroupId, 
  groups, 
  onSelectGroup,
  className = '' 
}: GroupDropdownSelectorProps) => {
  const isMobile = useIsMobile();
  
  // Find the current group object
  const currentGroup = groups.find(group => group.id === selectedGroupId) || groups[0];
  
  // If not mobile, don't render anything
  if (!isMobile) return null;
  
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
              <span>{currentGroup?.name || "Select Group"}</span>
              {currentGroup?.isJoinedGroup && (
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
              onClick={() => onSelectGroup(group.id)}
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
