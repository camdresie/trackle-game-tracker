import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { LeaderboardPlayer, SortByOption } from '@/types/leaderboard';
import { games, isLowerScoreBetter } from '@/utils/gameData';
import ShareModal from '@/components/ShareModal';

interface LeaderboardShareProps {
  players: LeaderboardPlayer[];
  selectedGame: string;
  timeFilter: 'all' | 'today';
  sortBy: SortByOption;
  className?: string;
}

const LeaderboardShare = ({ players, selectedGame, timeFilter, sortBy, className }: LeaderboardShareProps) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Find the current game
  const currentGame = games.find(game => game.id === selectedGame);
  const gameTitle = currentGame ? currentGame.name : 'Game';
  
  // Format today's date for the share text
  const getTodayFormatted = () => {
    return formatInTimeZone(new Date(), 'America/New_York', 'MMMM d, yyyy');
  };
  
  // Get top 3 players for the share text based on the current sort criteria
  const getTopPlayers = () => {
    const relevantPlayers = timeFilter === 'today' 
      ? players.filter(player => player.today_score !== null)
      : players;
    
    const lowerBetter = isLowerScoreBetter(selectedGame);

    const sortedPlayers = [...relevantPlayers].sort((a, b) => {
      let scoreA: number | null = 0;
      let scoreB: number | null = 0;

      if (timeFilter === 'today') {
        // Today view always sorts by today_score, regardless of the 'sortBy' prop
        // which might be 'totalScore' in this case
        scoreA = a.today_score;
        scoreB = b.today_score;
      } else {
        // All-time view uses the sortBy prop
        switch (sortBy) {
          case 'averageScore': // Correct case
            scoreA = a.average_score;
            scoreB = b.average_score;
            break;
          case 'bestScore':
            scoreA = a.best_score;
            scoreB = b.best_score;
            break;
          case 'totalGames': // Correct case
            scoreA = a.total_games;
            scoreB = b.total_games;
            break;
          default: // Default case (should ideally not happen if sortBy is typed correctly)
            scoreA = a.average_score; 
            scoreB = b.average_score;
        }
      }
      
      // Handle null scores - nulls go last
      if (scoreA === null && scoreB === null) return 0;
      if (scoreA === null) return 1;
      if (scoreB === null) return -1;
      
      // Handle zero scores for lowerBetter games (0 means not played/no score)
      // For totalGames, zero is valid, so skip this check
      if (lowerBetter && sortBy !== 'totalGames') { 
        if (scoreA === 0 && scoreB === 0) return 0;
        if (scoreA === 0) return 1; // Zeros go last
        if (scoreB === 0) return -1; // Zeros go last
      }
      
      // Actual sorting logic
      if (lowerBetter && sortBy !== 'totalGames') {
          return scoreA - scoreB; // Lower is better (except for totalGames)
      } else {
          return scoreB - scoreA; // Higher is better (includes totalGames)
      }
    });
    
    // Return up to top 3 players
    return sortedPlayers.slice(0, 3);
  };
  
  // Format a score based on the game type and sort option
  const formatScore = (score: number | null): string => {
    if (score === null || score === undefined) return '-';
    
    // If sorting by total games, just return the number as a string
    if (sortBy === 'totalGames') {
      return score.toString();
    }
    
    // Format time-based scores (MM:SS) for relevant games ONLY when NOT sorting by totalGames
    if ((selectedGame === 'mini-crossword' || selectedGame === 'minute-cryptic')) { 
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Format to at most 1 decimal place for average scores (only when sorting by average score)
    if (sortBy === 'averageScore' && typeof score === 'number' && !Number.isInteger(score)) {
      return score.toFixed(1);
    }
    
    // Default: return score as a string
    return score.toString();
  };
  
  // Get unit label for the game based on sort type and game
  const getUnitLabel = (): string => {
    // If sorting by total games, the unit is always "games"
    if (sortBy === 'totalGames') {
      return 'games';
    }

    // For other sort types (score, average, best), determine unit by game
    if (['wordle', 'quordle', 'connections', 'framed', 'nerdle', 'worldle', 'sqnces-6', 'sqnces-7', 'sqnces-8'].includes(selectedGame)) {
      return 'tries'; // Or mistakes, guesses etc. - using 'tries' generally
    } else if (selectedGame === 'mini-crossword' || selectedGame === 'minute-cryptic') {
      return '';  // No unit for time-based scores (MM:SS format)
    } else if (selectedGame === 'waffle') {
      return 'swaps';
    } else {
      // Default unit for other games (e.g., Betweenle points)
      return 'pts'; 
    }
  };

  // Generate the share text
  const generateShareText = () => {
    const topPlayers = getTopPlayers();
    const unitLabel = getUnitLabel(); // Unit label depends on sortBy and timeFilter now
    
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
        
        let score: number | null = null;
        let scoreContext = '';

        if (timeFilter === 'today') {
          // Today view always shows today's score
          score = player.today_score;
          scoreContext = 'Today'; 
        } else {
          // All-time view shows score based on sortBy
          switch (sortBy) {
            case 'averageScore': // Correct case
              score = player.average_score;
              scoreContext = 'Avg';
              break;
            case 'bestScore':
              score = player.best_score;
              scoreContext = 'Best';
              break;
            case 'totalGames': // Correct case
              score = player.total_games;
              scoreContext = 'Games';
              break;
            default: // Should not happen with typed sortBy
              score = player.average_score; 
              scoreContext = 'Avg';
          }
        }
        
        const formattedScore = formatScore(score);
        // Only add unit label if it's not empty
        const scoreWithUnit = unitLabel ? `${formattedScore} ${unitLabel}` : formattedScore;
        
        shareText += `${medal} ${player.username}: ${scoreWithUnit} (${scoreContext})\n`;
      });
    }
    
    shareText += `\nTrack your game stats on Trackle!`; // Updated promo line
    
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
        <Share2 className="w-4 h-4 mr-2" /> {/* Added margin */}
        <span className="hidden sm:inline">Share</span> {/* Hide text on small screens */} 
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
