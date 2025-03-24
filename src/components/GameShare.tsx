
import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { Game, Score } from '@/utils/types';
import ShareModal from '@/components/ShareModal';

interface GameShareProps {
  game: Game;
  latestScore?: Score;
  averageScore?: number;
  bestScore?: number;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

const GameShare = ({ game, latestScore, averageScore, bestScore, className, size = "default" }: GameShareProps) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Format today's date for the share text
  const getTodayFormatted = () => {
    return formatInTimeZone(new Date(), 'America/New_York', 'MMMM d, yyyy');
  };
  
  // Format a score based on the game type
  const formatScore = (score?: number): string => {
    if (score === null || score === undefined) return '-';
    
    // Format to at most 2 decimal places for average scores
    if (typeof score === 'number' && !Number.isInteger(score)) {
      return score.toFixed(2);
    }
    
    return score.toString();
  };
  
  // Get unit label for the game
  const getUnitLabel = (): string => {
    if (['wordle', 'quordle'].includes(game.id)) {
      return 'tries';
    } else if (game.id === 'mini-crossword') {
      return 'seconds';
    } else {
      return 'points';
    }
  };
  
  // Check if the game was played today
  const isPlayedToday = () => {
    if (!latestScore) return false;
    
    // Generate today's date in YYYY-MM-DD format
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    return latestScore.date === today;
  };
  
  // Generate the share text
  const generateShareText = () => {
    const unitLabel = getUnitLabel();
    
    let shareText = `🎮 My ${game.name} Stats - ${getTodayFormatted()}\n\n`;
    
    // Add today's score if available
    if (isPlayedToday() && latestScore) {
      shareText += `🎯 Today: ${formatScore(latestScore.value)} ${unitLabel}\n`;
    }
    
    // Add best score if available
    if (bestScore) {
      shareText += `🏆 Best: ${formatScore(bestScore)} ${unitLabel}\n`;
    }
    
    // Add average score if available
    if (averageScore) {
      shareText += `⭐ Average: ${formatScore(averageScore)} ${unitLabel}\n`;
    }
    
    shareText += `\nI'm keeping my stats on Trackle! Join me at https://www.ontrackle.com`;
    
    return shareText;
  };
  
  return (
    <>
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={() => setShowShareModal(true)}
      >
        <Share2 className="w-4 h-4 mr-2" />
        <span className="md:inline">Share</span>
      </Button>
      
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        shareText={generateShareText()}
        title={`Share ${game.name} Stats`}
      />
    </>
  );
};

export default GameShare;
