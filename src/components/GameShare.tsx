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
  
  // Get unit label for the game, potentially pluralized
  const getUnitLabel = (scoreValue?: number | null): string => {
    let baseUnit: string;
    let singularUnit: string;

    if (['wordle', 'quordle', 'framed', 'nerdle', 'worldle'].includes(game.id)) { // Add worldle
      baseUnit = 'tries';
      singularUnit = 'try';
    } else if (['mini-crossword', 'minute-cryptic'].includes(game.id)) { // Added minute-cryptic
      baseUnit = 'seconds';
      singularUnit = 'second';
    } else if (['connections'].includes(game.id)) { // Added connections
      baseUnit = 'mistakes'; // Using 'mistakes' for connections
      singularUnit = 'mistake';
    } else {
      baseUnit = 'points'; // Default for points-based games like Betweenle, Spelling Bee
      singularUnit = 'point';
    }

    // Handle average scores (non-integers) or scores != 1 by returning plural
    // Use Math.abs just in case, though scores should be positive
    if (scoreValue !== null && scoreValue !== undefined && Math.abs(scoreValue) === 1 && Number.isInteger(scoreValue)) {
      return singularUnit;
    }
    return baseUnit;
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
    // Note: getUnitLabel is now called PER stat line with the score value
    
    let shareText = `🎮 My ${game.name} Stats - ${getTodayFormatted()}\n\n`;
    
    // Add today's score if available
    if (isPlayedToday() && latestScore) {
      const scoreVal = latestScore.value;
      shareText += `🎯 Today: ${formatScore(scoreVal)} ${getUnitLabel(scoreVal)}\n`;
    }
    
    // Add best score if available
    if (bestScore !== null && bestScore !== undefined) { // Check for null/undefined bestScore
      shareText += `🏆 Best: ${formatScore(bestScore)} ${getUnitLabel(bestScore)}\n`;
    }
    
    // Add average score if available
    // For average, we generally expect plural unless it rounds exactly to 1.0
    if (averageScore !== null && averageScore !== undefined) { // Check for null/undefined averageScore
      // Let getUnitLabel handle non-integer averages (it will return plural)
      shareText += `⭐ Average: ${formatScore(averageScore)} ${getUnitLabel(averageScore)}\n`;
    }
    
    // Add promotional text but no URL - the URL will be added by the ShareModal
    shareText += `\nI'm tracking game scores on Trackle!`;
    
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
