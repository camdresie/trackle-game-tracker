
import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { Game, Score } from '@/utils/types';
import { toast } from '@/hooks/use-toast';

interface GameShareProps {
  game: Game;
  latestScore?: Score;
  averageScore?: number;
  bestScore?: number;
  className?: string;
}

const GameShare = ({ game, latestScore, averageScore, bestScore, className }: GameShareProps) => {
  const [isCopied, setIsCopied] = useState(false);
  
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
  
  // Handle copying to clipboard
  const handleCopyToClipboard = async () => {
    const shareText = generateShareText();
    
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      toast({
        title: 'Copied to clipboard!',
        description: 'Share with your friends!',
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleCopyToClipboard}
    >
      {isCopied ? (
        <>
          <Check className="w-4 h-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>Share Stats</span>
        </>
      )}
    </Button>
  );
};

export default GameShare;
