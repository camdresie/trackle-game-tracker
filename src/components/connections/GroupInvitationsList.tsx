
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GroupInvitation } from '@/hooks/useGroupInvitations';
import { Check, X, AlertCircle, Users } from 'lucide-react';

interface GroupInvitationsListProps {
  invitations: GroupInvitation[];
  isLoading: boolean;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

const GroupInvitationsList: React.FC<GroupInvitationsListProps> = ({
  invitations,
  isLoading,
  onAccept,
  onDecline
}) => {
  // Debug: Log the invitations data
  React.useEffect(() => {
    console.log('GroupInvitationsList - Invitations:', invitations);
  }, [invitations]);

  if (isLoading) {
    return (
      <Card className="p-4 mb-6 animate-pulse">
        <div className="h-16 bg-muted/30 rounded"></div>
      </Card>
    );
  }
  
  if (!invitations || invitations.length === 0) {
    console.log('No invitations to display');
    return null;
  }
  
  return (
    <Card className="p-4 mb-6 border-accent/50">
      <div className="flex items-center gap-2 mb-3 text-accent">
        <AlertCircle className="w-5 h-5" />
        <h3 className="font-medium">Group Invitations ({invitations.length})</h3>
      </div>
      
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{invitation.groupName}</p>
                <p className="text-sm text-muted-foreground">From {invitation.groupOwner}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-1 border-red-300 hover:bg-red-50 hover:text-red-600"
                onClick={() => onDecline(invitation.id)}
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </Button>
              <Button 
                size="sm" 
                className="flex items-center gap-1 bg-accent hover:bg-accent/80"
                onClick={() => onAccept(invitation.id)}
              >
                <Check className="w-4 h-4" />
                <span>Accept</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default GroupInvitationsList;
