
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  groupOwner: string;
  status: string;
}

interface GroupInvitationsListProps {
  invitations: GroupInvitation[];
  isLoading: boolean;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

const GroupInvitationsList = ({ 
  invitations, 
  isLoading, 
  onAccept, 
  onDecline 
}: GroupInvitationsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2 mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  if (!invitations || invitations.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
        <UserPlus className="h-5 w-5" />
        <span>Group Invitations</span>
      </h3>
      
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{invitation.groupName}</CardTitle>
              <CardDescription>You've been invited to join this group</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0 flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDecline(invitation.id)}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                <span>Decline</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => onAccept(invitation.id)}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                <span>Accept</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GroupInvitationsList;
