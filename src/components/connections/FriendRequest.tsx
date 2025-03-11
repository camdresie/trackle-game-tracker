
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X } from 'lucide-react';

interface FriendRequestProps {
  id: string;
  playerName: string;
  playerAvatar?: string;
  onAccept: (connectionId: string) => void;
  onDecline: (connectionId: string) => void;
  isLoading: boolean;
}

const FriendRequest = ({
  id,
  playerName,
  playerAvatar,
  onAccept,
  onDecline,
  isLoading
}: FriendRequestProps) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={playerAvatar || undefined} />
          <AvatarFallback>
            {playerName?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <span>{playerName}</span>
      </div>
      <div className="flex gap-1">
        <Button 
          size="sm" 
          variant="ghost"
          className="text-green-500"
          onClick={() => onAccept(id)}
          disabled={isLoading}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          className="text-rose-500"
          onClick={() => onDecline(id)}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FriendRequest;
