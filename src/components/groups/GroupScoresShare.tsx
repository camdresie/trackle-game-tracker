import React, { useState, ReactNode } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import ShareModal from '@/components/ShareModal';
import { isLowerScoreBetter, getLabelByGame } from '@/utils/gameData'; // Import the helper

interface GroupMemberScore {
  playerId: string;
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
  currentUserId?: string; // Add currentUserId
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
  currentUserId, // Add currentUserId
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
    const lowerBetter = gameId ? isLowerScoreBetter(gameId) : false;

    // --- Refactored Player Processing --- 

    // 1. Create a map to store unique players by ID, prioritizing best name
    const allPlayersById = new Map<string, { id: string, name: string, score: number | null, hasPlayed: boolean }>();

    const addOrUpdatePlayer = (player: { id: string, name: string, score: number | null, hasPlayed: boolean }) => {
      if (!player.id) {
        console.warn("Attempted to add player without ID:", player);
        return; // Cannot process without an ID
      }
      const existing = allPlayersById.get(player.id);
      const isBetterName = (name: string) => name && !name.includes('@') && name !== 'Unknown' && name !== 'Unknown Player' && name !== 'You';
      
      // Decide whether to add/update based on existence and name quality
      if (!existing || (player.name && isBetterName(player.name) && (!existing.name || !isBetterName(existing.name)))) {
        // Add if new, or if new name is better than existing name
        allPlayersById.set(player.id, { ...player });
      } else if (existing && player.name && !isBetterName(player.name) && existing.name && isBetterName(existing.name)) {
        // Keep existing entry if its name is better, but update score/played status
        allPlayersById.set(player.id, { ...existing, score: player.score, hasPlayed: player.hasPlayed }); 
      } else if (existing) {
        // Existing name is better or equal quality, just update score/played status
         allPlayersById.set(player.id, { ...existing, score: player.score, hasPlayed: player.hasPlayed }); 
      }
      // If existing and new name is missing or not better, do nothing (keep existing)
    };

    // Add current user - use currentUserId prop if available
    if (currentUserId) {
      addOrUpdatePlayer({
        id: currentUserId,
        name: useActualUsername ? currentUserName : 'You', // Use the passed username or 'You'
        score: currentUserScore !== undefined ? currentUserScore : null,
        hasPlayed: currentUserHasPlayed
      });
    }

    // Add members - use member.playerId
    members.forEach(member => {
      addOrUpdatePlayer({
        id: member.playerId,
        name: member.playerName,
        score: member.score,
        hasPlayed: member.hasPlayed
      });
    });

    // 2. Generate Played List (filter, sort)
    const playedPlayers = Array.from(allPlayersById.values())
      .filter(p => p.hasPlayed && p.score !== null && p.score !== undefined)
      .sort((a, b) => {
        const scoreA = typeof a.score === 'number' ? a.score : (lowerBetter ? Infinity : -Infinity);
        const scoreB = typeof b.score === 'number' ? b.score : (lowerBetter ? Infinity : -Infinity);
        return lowerBetter ? scoreA - scoreB : scoreB - scoreA;
      });

    // Add ranked scores to share text
    if (playedPlayers.length > 0) {
      playedPlayers.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        const formattedScore = player.score; 
        let scoreString = '-';
        if (formattedScore !== null && formattedScore !== undefined) {
            const unitLabel = gameId ? getLabelByGame(gameId) : '';
            let finalUnitLabel = unitLabel;
            // Singularization logic (keep as before)
            if (unitLabel === 'tries' && formattedScore === 1) finalUnitLabel = 'try';
            else if (unitLabel === 'seconds' && formattedScore === 1) finalUnitLabel = 'second';
            else if (unitLabel === 'hints' && formattedScore === 1) finalUnitLabel = 'hint';
            else if (unitLabel === 'swaps' && formattedScore === 1) finalUnitLabel = 'swap';
            scoreString = `${formattedScore}${finalUnitLabel ? ' ' + finalUnitLabel : ''}`;
        }
        // Use player.name which is the deduplicated, best available name
        shareText += `${medal} ${player.name}: ${scoreString}\n`;
      });
    } else {
      shareText += 'No scores recorded yet today.\n';
    }

    // 3. Generate Not Played Yet List (filter by played status, sort by name)
    const notPlayedYet = Array.from(allPlayersById.values())
      .filter(p => !p.hasPlayed && p.id !== currentUserId) // Filter out non-players AND the current user ID
      .map(p => p.name) // Get the best name
      .filter(name => name && name !== 'You') // Filter out null/empty names and the literal 'You'
      .sort(); // Sort names alphabetically

    if (notPlayedYet.length > 0) {
        shareText += "\nNot played yet:\n";
        notPlayedYet.forEach(name => {
            shareText += `- ${name}\n`;
        });
    }

    // --- End Refactored Processing ---

    return shareText;
  };
  
  // Generate the share text with promotional line only
  const generateShareText = () => {
    const shareContent = generateShareContent();
    // Add the promotional line only - URL will be added by ShareModal
    // return `${shareContent}\nTrack your game stats on Trackle!`; // Removed promo line
    return shareContent; // Return only the main content
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
