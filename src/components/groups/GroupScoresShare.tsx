import React, { useState, ReactNode } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import ShareModal from '@/components/ShareModal';
import { isLowerScoreBetter, getLabelByGame } from '@/utils/gameData'; // Import the helper

interface GroupMemberScore {
  playerName: string;
  score: number | null;
  hasPlayed: boolean;
}

// Interface for the combined player data before sorting
interface PlayerScore {
  name: string;
  score: number;
}

interface GroupScoresShareProps {
  groupName: string;
  gameName: string;
  gameId?: string; // Add gameId to determine sorting
  gameColor: string;
  members: GroupMemberScore[];
  currentUserName?: string;
  currentUserScore?: number | null;
  currentUserHasPlayed?: boolean;
  className?: string;
  useActualUsername?: boolean;
  children?: ReactNode;
}

const GroupScoresShare = ({ 
  groupName, 
  gameName, 
  gameId, // Use gameId
  gameColor, 
  members, 
  currentUserName = 'You',
  currentUserScore,
  currentUserHasPlayed = false,
  className,
  useActualUsername = false, 
  children
}: GroupScoresShareProps) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Format today's date for the share text
  const getTodayFormatted = () => {
    return formatInTimeZone(new Date(), 'America/New_York', 'MMMM d, yyyy');
  };
  
  // Generate the core share text content with ranking
  const generateShareContent = () => {
    let shareText = `🎮 ${groupName} - ${gameName} Scores for ${getTodayFormatted()}\n\n`;
    
    const playedPlayers: PlayerScore[] = [];
    const addedPlayerNames = new Set<string>(); // Tracks added PLAYER NAMES to avoid duplicates
    const lowerBetter = gameId ? isLowerScoreBetter(gameId) : false;

    // Determine the display name for the current user
    const currentUserDisplayName = useActualUsername ? currentUserName : 'You';

    // Add current user if they played
    if (currentUserHasPlayed && currentUserScore !== null && currentUserScore !== undefined) {
      playedPlayers.push({ name: currentUserDisplayName, score: currentUserScore });
      addedPlayerNames.add(currentUserDisplayName); // Add the name we actually used
      // If we used the actual username, also block "You" in case it appears in the members list
      if (useActualUsername) {
          addedPlayerNames.add('You'); 
      }
    }

    // Add other members if they played and haven't been added already
    members.forEach(member => {
      // Skip if this player name has already been added (either as display name or explicitly blocked "You")
      if (addedPlayerNames.has(member.playerName)) {
        return;
      }
      
      // Add the member if they played
      if (member.hasPlayed && member.score !== null && member.score !== undefined) {
        playedPlayers.push({ name: member.playerName, score: member.score });
        addedPlayerNames.add(member.playerName); // Mark this name as added
      }
    });

    // Sort the played players
    playedPlayers.sort((a, b) => {
      // Handle potential non-numeric scores defensively, although they should be numbers
      const scoreA = typeof a.score === 'number' ? a.score : (lowerBetter ? Infinity : -Infinity);
      const scoreB = typeof b.score === 'number' ? b.score : (lowerBetter ? Infinity : -Infinity);
      return lowerBetter ? scoreA - scoreB : scoreB - scoreA;
    });

    // Add ranked scores to share text
    if (playedPlayers.length > 0) {
      playedPlayers.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        // Format score (you might want a more sophisticated formatter here)
        const formattedScore = player.score; // Basic formatting for now
        
        let scoreString = '-'; // Default if score is missing
        if (formattedScore !== null && formattedScore !== undefined) {
            const unitLabel = gameId ? getLabelByGame(gameId) : '';
            let finalUnitLabel = unitLabel;
            if (unitLabel === 'tries' && formattedScore === 1) {
                finalUnitLabel = 'try';
            } else if (unitLabel === 'seconds' && formattedScore === 1) {
                finalUnitLabel = 'second';
            }
            scoreString = `${formattedScore}${finalUnitLabel ? ' ' + finalUnitLabel : ''}`;
        }

        shareText += `${medal} ${player.name}: ${scoreString}\n`;
      });
    } else {
      shareText += 'No scores recorded yet today.\n';
    }

    // --- Determine "Not played yet" list using only actual usernames --- 

    // 1. Combine ALL potential actual usernames (excluding literal "You")
    const allActualNames = new Set<string>();
    if (currentUserName && currentUserName !== 'You') {
        allActualNames.add(currentUserName);
    }
    members.forEach(member => {
        if (member.playerName && member.playerName !== 'You') {
            allActualNames.add(member.playerName);
        }
    });

    // 2. Identify ACTUAL usernames of those who DID play
    const playedActualNames = new Set<string>();
    if (currentUserHasPlayed && currentUserName && currentUserName !== 'You') {
        playedActualNames.add(currentUserName);
    }
    members.forEach(member => {
        if (member.hasPlayed && member.playerName && member.playerName !== 'You') {
            playedActualNames.add(member.playerName);
        }
    });

    // 3. Determine who hasn't played by finding the difference
    const notPlayedYetInitial: string[] = [];
    allActualNames.forEach(name => {
        if (!playedActualNames.has(name)) {
            notPlayedYetInitial.push(name);
        }
    });

    // 4. Explicitly filter out "You" and sort the final list alphabetically
    const notPlayedYet = notPlayedYetInitial.filter(name => name !== 'You').sort();

    if (notPlayedYet.length > 0) {
        shareText += "\nNot played yet:\n";
        notPlayedYet.forEach(name => {
            shareText += `- ${name}\n`; // Only actual usernames here
        });
    }

    return shareText;
  };
  
  // Generate the share text with promotional line only
  const generateShareText = () => {
    const shareContent = generateShareContent();
    // Add the promotional line only - URL will be added by ShareModal
    return `${shareContent}\nTrack your game stats on Trackle!`; // Updated promo line
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
          title={`Share ${groupName} ${gameName} Scores`}
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
        title={`Share ${groupName} ${gameName} Scores`}
      />
    </>
  );
};

export default GroupScoresShare;
