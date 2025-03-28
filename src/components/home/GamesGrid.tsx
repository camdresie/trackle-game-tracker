
import { Trophy } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { Game, Score } from '@/utils/types';
import { calculateAverageScore, calculateBestScore } from '@/utils/gameData';

interface GamesGridProps {
  isLoading: boolean;
  gamesList: Game[];
  scores: Score[];
}

const GamesGrid = ({ isLoading, gamesList, scores }: GamesGridProps) => {
  return (
    <section className="mb-8 animate-slide-up" style={{animationDelay: '100ms'}}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Games
        </h2>
      </div>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
        {isLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="animate-pulse h-40 bg-muted rounded-xl"></div>
          ))
        ) : (
          gamesList.map(game => {
            const gameScores = scores.filter(score => score.gameId === game.id);
            const latestScore = gameScores.length > 0 
              ? gameScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
              : undefined;
            const averageScore = calculateAverageScore(gameScores);
            const bestScore = calculateBestScore(gameScores, game);
            
            return (
              <GameCard 
                key={game.id}
                game={game}
                latestScore={latestScore}
                averageScore={averageScore}
                bestScore={bestScore}
              />
            );
          })
        )}
      </div>
    </section>
  );
};

export default GamesGrid;
