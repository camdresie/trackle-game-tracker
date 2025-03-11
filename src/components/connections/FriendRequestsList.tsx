
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import FriendRequest from './FriendRequest';

interface FriendRequestsListProps {
  pendingRequests: Array<{
    id: string;
    playerId: string;
    friendId: string;
    playerName: string;
    playerAvatar?: string;
  }>;
  onAccept: (connectionId: string) => void;
  onDecline: (connectionId: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

const FriendRequestsList = ({
  pendingRequests,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining
}: FriendRequestsListProps) => {
  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2">Friend Requests</h3>
      <ScrollArea className="h-32">
        <div className="space-y-2">
          {pendingRequests.map(request => (
            <FriendRequest
              key={request.id}
              id={request.id}
              playerName={request.playerName}
              playerAvatar={request.playerAvatar}
              onAccept={onAccept}
              onDecline={onDecline}
              isLoading={isAccepting || isDeclining}
            />
          ))}
        </div>
      </ScrollArea>
      <Separator className="my-4" />
    </div>
  );
};

export default FriendRequestsList;
