
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
  
  // Generate the core share text content without the promotional link
  const generateShareContent = () => {
    let shareText = `🎮 ${groupName} - ${gameName} Scores for ${getTodayFormatted()}\n\n`;
    
    // Create a Set to track which player names have already been added
    // This prevents duplicate entries for the current user
    const addedPlayers = new Set<string>();
    
    // Add current user's score if they've played and we want to show them separately
    if (currentUserHasPlayed && currentUserScore !== null) {
      // Use actual username if specified, otherwise use "You"
      const displayName = useActualUsername ? currentUserName : 'You';
      shareText += `${displayName}: ${currentUserScore}\n`;
      
      // Add this player to our tracking set
      addedPlayers.add(useActualUsername ? currentUserName : 'You');
    }
    
    // Add scores for all group members who have played,
    // but skip the current user if they've already been added
    members.forEach(member => {
      // Skip if the player is the current user and we've already added them
      const isCurrentUser = useActualUsername && member.playerName === currentUserName;
      
      if (member.hasPlayed && member.score !== null && !addedPlayers.has(member.playerName)) {
        shareText += `${member.playerName}: ${member.score}\n`;
        addedPlayers.add(member.playerName);
      }
    });
    
    // Add message for members who haven't played
    const notPlayedMembers = members.filter(m => !m.hasPlayed && !addedPlayers.has(m.playerName));
    if (notPlayedMembers.length > 0) {
      shareText += "\nNot played yet today:\n";
      notPlayedMembers.forEach(member => {
        shareText += `${member.playerName}\n`;
      });
    }
    
    // If current user hasn't played and not already listed
    if (!currentUserHasPlayed && !addedPlayers.has(useActualUsername ? currentUserName : 'You')) {
      // Use actual username if specified, otherwise use "You"
      const displayName = useActualUsername ? currentUserName : 'You';
      shareText += `${displayName}\n`;
    }
    
    return shareText;
  };
  
  // Generate the share text with promotional link for external sharing only
  const generateShareText = () => {
    const shareContent = generateShareContent();
    // Put the URL on a separate line to help with link detection in messaging apps
    return `${shareContent}\n\nI'm tracking our scores on Trackle!\nhttps://www.ontrackle.com`;
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
