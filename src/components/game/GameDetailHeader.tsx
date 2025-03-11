
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Game } from '@/utils/types';

interface GameDetailHeaderProps {
  game: Game;
  user: any;
  onAddScore: () => void;
}

const GameDetailHeader = ({ game, user, onAddScore }: GameDetailHeaderProps) => {
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
        
        <Button 
          onClick={onAddScore}
          disabled={!user}
        >
          Add Today's Score
        </Button>
      </div>
    </>
  );
};

export default GameDetailHeader;
