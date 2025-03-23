import React, { useState, ReactNode } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import ShareModal from '@/components/ShareModal';

interface GroupMemberScore {
  playerName: string;
  score: number | null;  // Changed from required to allow null
  hasPlayed: boolean;
}

interface GroupScoresShareProps {
  groupName: string;
  gameName: string;
  gameColor: string;
  members: GroupMemberScore[];
  currentUserName?: string;
  currentUserScore?: number | null;
  currentUserHasPlayed?: boolean;
  className?: string;
  useActualUsername?: boolean; // New prop to determine if we should use actual username
  children?: ReactNode; // Add children prop
}

const GroupScoresShare = ({ 
  groupName, 
  gameName, 
  gameColor, 
  members, 
  currentUserName = 'You',
  currentUserScore,
  currentUserHasPlayed = false,
  className,
  useActualUsername = false, // Default to showing "You" unless explicitly set
  children // Accept children prop
}: GroupScoresShareProps) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Format today's date for the share text
  const getTodayFormatted = () => {
    return formatInTimeZone(new Date(), 'America/New_York', 'MMMM d, yyyy');
  };
  
  // Generate the share text with group members scores
  const generateShareText = () => {
    let shareText = `🎮 ${groupName} - ${gameName} Scores for ${getTodayFormatted()}\n\n`;
    
    // Add current user's score if they've played
    if (currentUserHasPlayed && currentUserScore !== null) {
      // Use actual username if specified, otherwise use "You"
      const displayName = useActualUsername ? currentUserName : 'You';
      shareText += `${displayName}: ${currentUserScore}\n`;
    }
    
    // Add scores for all group members who have played
    members.forEach(member => {
      if (member.hasPlayed && member.score !== null) {
        shareText += `${member.playerName}: ${member.score}\n`;
      }
    });
    
    // Add message for members who haven't played
    const notPlayedMembers = members.filter(m => !m.hasPlayed);
    if (notPlayedMembers.length > 0) {
      shareText += "\nNot played yet today:\n";
      notPlayedMembers.forEach(member => {
        shareText += `${member.playerName}\n`;
      });
    }
    
    // If current user hasn't played
    if (!currentUserHasPlayed) {
      // Use actual username if specified, otherwise use "You"
      const displayName = useActualUsername ? currentUserName : 'You';
      shareText += `${displayName}\n`;
    }
    
    shareText += `\nI'm tracking our scores on Trackle! Join us at https://www.ontrackle.com`;
    
    return shareText;
  };
  
  // Handle opening the share modal
  const handleOpenShareModal = () => {
    setShowShareModal(true);
  };

  // If children are provided, use them with the onClick handler
  if (children) {
    return (
      <>
        <div onClick={handleOpenShareModal} className={className}>
          {children}
        </div>
        
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          shareText={generateShareText()}
          title={`Share ${groupName} Scores`}
        />
      </>
    );
  }
  
  // Otherwise, use the default button
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={handleOpenShareModal}
      >
        <Share2 className="w-4 h-4 mr-1" />
        <span>Share Scores</span>
      </Button>
      
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        shareText={generateShareText()}
        title={`Share ${groupName} Scores`}
      />
    </>
  );
};

export default GroupScoresShare;
