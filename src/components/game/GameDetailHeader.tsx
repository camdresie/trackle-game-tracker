
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Game, Score } from '@/utils/types';
import GameShare from '@/components/GameShare';
import { isToday } from '@/utils/dateUtils';

interface GameDetailHeaderProps {
  game: Game;
  user: any;
  onAddScore: () => void;
  latestScore?: Score;
  averageScore?: number;
  bestScore?: number;
}

const GameDetailHeader = ({ game, user, onAddScore, latestScore, averageScore, bestScore }: GameDetailHeaderProps) => {
  const handleExternalLinkClick = (e: React.MouseEvent) => {
    if (game.externalUrl) {
      window.open(game.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  // Check if the user has logged a score for today
  const hasScoreForToday = latestScore && isToday(latestScore.date);
  
  return (
    <>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Games
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-lg ${game.color}`}>
              {/* Icon would be here */}
            </div>
            <h1 className="text-3xl font-bold">{game.name}</h1>
          </div>
          <p className="text-muted-foreground max-w-lg mb-4">{game.description}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {game.externalUrl && (
            <Button 
              variant="outline" 
              onClick={handleExternalLinkClick}
              className="w-full sm:w-auto mb-2 sm:mb-0 mr-2"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Play Game
            </Button>
          )}
          <GameShare 
            game={game}
            latestScore={latestScore}
            averageScore={averageScore}
            bestScore={bestScore}
            className="w-full sm:w-auto mb-2 sm:mb-0"
          />
          <Button 
            onClick={onAddScore}
            disabled={!user}
          >
            {hasScoreForToday ? 'Edit Today\'s Score' : 'Add Today\'s Score'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default GameDetailHeader;
