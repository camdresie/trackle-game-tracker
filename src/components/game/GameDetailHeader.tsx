
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
      <div className="mb-4 md:mb-6">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Games
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-lg ${game.color}`}>
              {/* Icon would be here */}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{game.name}</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mb-3 md:mb-4">{game.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {game.externalUrl && (
            <Button 
              variant="outline" 
              onClick={handleExternalLinkClick}
              size="sm"
              className="flex-1 md:flex-none"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Play
            </Button>
          )}
          <GameShare 
            game={game}
            latestScore={latestScore}
            averageScore={averageScore}
            bestScore={bestScore}
            className="flex-1 md:flex-none"
            size="sm"
          />
          <Button 
            onClick={onAddScore}
            disabled={!user}
            size="sm"
            className="flex-1 md:flex-none"
          >
            {hasScoreForToday ? 'Edit Score' : 'Add Score'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default GameDetailHeader;
