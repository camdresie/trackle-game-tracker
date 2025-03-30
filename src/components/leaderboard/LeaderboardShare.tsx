import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { LeaderboardPlayer } from '@/types/leaderboard';
import { games } from '@/utils/gameData';
import ShareModal from '@/components/ShareModal';

interface LeaderboardShareProps {
  players: LeaderboardPlayer[];
  selectedGame: string;
  timeFilter: 'all' | 'today';
  className?: string;
}

const LeaderboardShare = ({ players, selectedGame, timeFilter, className }: LeaderboardShareProps) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
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
        // Higher is better for other games (including betweenle)
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
    const isLowerBetter = ['wordle', 'mini-crossword', 'connections', 'framed', 'nerdle'].includes(selectedGame);
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
    
    // Add the promotional line only - URL will be added by ShareModal
    shareText += `\nI'm keeping my stats on Trackle!`;
    
    return shareText;
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setShowShareModal(true)}
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </Button>
      
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        shareText={generateShareText()}
        title={`Share ${gameTitle} Leaderboard`}
      />
    </>
  );
};

export default LeaderboardShare;
