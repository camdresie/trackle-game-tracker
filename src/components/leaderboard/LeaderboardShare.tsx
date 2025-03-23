
import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { LeaderboardPlayer } from '@/types/leaderboard';
import { games } from '@/utils/gameData';
import { toast } from '@/hooks/use-toast';

interface LeaderboardShareProps {
  players: LeaderboardPlayer[];
  selectedGame: string;
  timeFilter: 'all' | 'today';
  className?: string;
}

const LeaderboardShare = ({ players, selectedGame, timeFilter, className }: LeaderboardShareProps) => {
  const [isCopied, setIsCopied] = useState(false);
  
  // Find the current game
  const currentGame = games.find(game => game.id === selectedGame);
  const gameTitle = currentGame ? currentGame.name : 'Game';
  
  // Format today's date for the share text
  const getTodayFormatted = () => {
    return formatInTimeZone(new Date(), 'America/New_York', 'MMMM d, yyyy');
  };
  
  // Get top 3 players for the share text
  const getTopPlayers = () => {
    // Filter only relevant players (with today's scores for today view)
    const relevantPlayers = timeFilter === 'today' 
      ? players.filter(player => player.today_score !== null)
      : players;
    
    // Sort players based on game type (for mini-crossword lower is better)
    const sortedPlayers = [...relevantPlayers].sort((a, b) => {
      const scoreA = timeFilter === 'today' ? a.today_score : (selectedGame === 'mini-crossword' ? a.best_score : a.average_score);
      const scoreB = timeFilter === 'today' ? b.today_score : (selectedGame === 'mini-crossword' ? b.best_score : a.average_score);
      
      if (scoreA === null) return 1;
      if (scoreB === null) return -1;
      
      if (['wordle', 'mini-crossword'].includes(selectedGame)) {
        // Lower is better for these games
        return scoreA - scoreB;
      } else {
        // Higher is better for other games
        return scoreB - scoreA;
      }
    });
    
    // Return up to top 3 players
    return sortedPlayers.slice(0, 3);
  };
  
  // Format a score based on the game type
  const formatScore = (score: number): string => {
    if (score === null || score === undefined) return '-';
    
    // Format time-based scores for Mini Crossword
    if (selectedGame === 'mini-crossword') {
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Format to at most 2 decimal places for average scores
    if (typeof score === 'number' && !Number.isInteger(score)) {
      return score.toFixed(2);
    }
    
    return score.toString();
  };
  
  // Get unit label for the game
  const getUnitLabel = (): string => {
    if (['wordle', 'quordle'].includes(selectedGame)) {
      return 'tries';
    } else if (selectedGame === 'mini-crossword') {
      return '';  // No need for unit label since we're showing the time format MM:SS
    } else {
      return 'points';
    }
  };
  
  // Generate the share text
  const generateShareText = () => {
    const topPlayers = getTopPlayers();
    const isLowerBetter = ['wordle', 'mini-crossword'].includes(selectedGame);
    const unitLabel = getUnitLabel();
    
    let shareText = `🎮 ${gameTitle} Leaderboard`;
    
    if (timeFilter === 'today') {
      shareText += ` - ${getTodayFormatted()}\n\n`;
    } else {
      shareText += ` - All Time\n\n`;
    }
    
    if (topPlayers.length === 0) {
      shareText += 'No players yet!\n';
    } else {
      topPlayers.forEach((player, index) => {
        const position = index + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        const score = timeFilter === 'today' 
          ? player.today_score
          : (isLowerBetter ? player.best_score : player.average_score);
        
        // Add context about what the score represents
        const scoreContext = timeFilter === 'today' 
          ? 'Today'
          : (isLowerBetter ? 'Best' : 'Avg');
        
        // Add unit label if it exists
        const formattedScore = formatScore(score);
        const scoreWithUnit = unitLabel ? `${formattedScore} ${unitLabel}` : formattedScore;
        
        shareText += `${medal} ${player.username}: ${scoreWithUnit} (${scoreContext})\n`;
      });
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
          <span>Share</span>
        </>
      )}
    </Button>
  );
};

export default LeaderboardShare;
