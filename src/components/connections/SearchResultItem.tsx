
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { Player } from '@/utils/types';

interface SearchResultItemProps {
  player: Player;
  onAddFriend: (friendId: string) => void;
  isLoading: boolean;
}

const SearchResultItem = ({ player, onAddFriend, isLoading }: SearchResultItemProps) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={player.avatar || undefined} />
          <AvatarFallback>{player.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <span>{player.name}</span>
      </div>
      <Button 
        size="sm" 
        variant="ghost"
        onClick={() => onAddFriend(player.id)}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SearchResultItem;
