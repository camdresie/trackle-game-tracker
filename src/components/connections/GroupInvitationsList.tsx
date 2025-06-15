import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GroupInvitation } from '@/hooks/useGroupInvitations';
import { Check, X, AlertCircle, Users, InboxIcon, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

interface GroupInvitationsListProps {
  invitations: GroupInvitation[];
  isLoading: boolean;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
  alwaysShow?: boolean;
}

const GroupInvitationsList: React.FC<GroupInvitationsListProps> = ({
  invitations,
  isLoading,
  onAccept,
  onDecline,
  alwaysShow = false
}) => {
  const isMobile = useIsMobile();
  
  // If loading, show a clean skeleton with fixed height to prevent layout shifts
  if (isLoading) {
    return (
      <Card className="p-4 mb-6 overflow-hidden border-accent/50">
        <div className="flex items-center gap-2 mb-3 text-accent">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-medium">Group Invitations</h3>
        </div>
        <div className="flex items-center justify-center h-16">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <span className="ml-2 text-muted-foreground">Processing invitation...</span>
        </div>
      </Card>
    );
  }
  
  // If no invitations and not set to always show, return null (don't render anything)
  if (!invitations || invitations.length === 0) {
    
    // If alwaysShow is true, show an empty state with fixed height
    if (alwaysShow) {
      return (
        <Card className="p-4 mb-6 border-muted/50">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <InboxIcon className="w-5 h-5" />
            <h3 className="font-medium">Group Invitations</h3>
          </div>
          
          <div className="py-6 flex flex-col items-center justify-center text-center text-muted-foreground">
            <InboxIcon className="w-10 h-10 mb-2 opacity-50" />
            <p>No pending group invitations</p>
            <p className="text-sm mt-1">When someone invites you to a group, it will appear here</p>
          </div>
        </Card>
      );
    }
    
    return null;
  }
  
  // If there are invitations, show them
  return (
    <Card className="p-4 mb-6 border-accent/50">
      <div className="flex items-center gap-2 mb-3 text-accent">
        <AlertCircle className="w-5 h-5" />
        <h3 className="font-medium">Group Invitations ({invitations.length})</h3>
      </div>
      
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="p-3 bg-muted/20 rounded-lg">
            {/* For mobile: Stack content vertically with buttons at the bottom */}
            {isMobile ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invitation.groupName || "Unknown Group"}</p>
                    <p className="text-sm text-muted-foreground">From {invitation.groupOwner || "Unknown User"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-1 bg-accent hover:bg-accent/80"
                    onClick={() => onAccept(invitation.id)}
                    disabled={isLoading}
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-1 border-red-300 hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDecline(invitation.id)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                    <span>Decline</span>
                  </Button>
                </div>
              </div>
            ) : (
              // For desktop: Keep the horizontal layout
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invitation.groupName || "Unknown Group"}</p>
                    <p className="text-sm text-muted-foreground">From {invitation.groupOwner || "Unknown User"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1 border-red-300 hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDecline(invitation.id)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                    <span>Decline</span>
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex items-center gap-1 bg-accent hover:bg-accent/80"
                    onClick={() => onAccept(invitation.id)}
                    disabled={isLoading}
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default GroupInvitationsList;
