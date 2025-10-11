import { useState, useMemo } from 'react';
import { Score } from '@/utils/types';
import { games } from '@/utils/gameData';
import ScoreChart from '@/components/ScoreChart';
import { ChartDateRangeSelector } from '@/components/ChartDateRangeSelector';
import { useChartDateRange } from '@/hooks/useChartDateRange';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PerformanceChartsSectionProps {
  allScores: Score[];
}

export const PerformanceChartsSection = ({ allScores }: PerformanceChartsSectionProps) => {
  const { selectedRange, setSelectedRange, currentConfig } = useChartDateRange('30d');
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  const playedGames = useMemo(() => {
    const gameIds = new Set(allScores.map(s => s.gameId));
    return games.filter(g => gameIds.has(g.id));
  }, [allScores]);

  const currentGame = playedGames[currentGameIndex];

  const filteredScores = useMemo(() => {
    if (!currentGame) return [];
    
    let scores = allScores.filter(s => s.gameId === currentGame.id);
    
    if (currentConfig.startDate) {
      scores = scores.filter(s => s.date >= currentConfig.startDate!);
    }
    if (currentConfig.endDate) {
      scores = scores.filter(s => s.date <= currentConfig.endDate!);
    }
    
    return scores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allScores, currentGame, currentConfig]);

  const goToPrevious = () => {
    setCurrentGameIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentGameIndex(prev => Math.min(playedGames.length - 1, prev + 1));
  };

  if (playedGames.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No game data available yet. Start playing games to see your performance trends!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={currentGameIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {currentGame?.name}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={currentGameIndex === playedGames.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <ChartDateRangeSelector
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </div>

      {filteredScores.length > 0 ? (
        <>
          <div className="h-60">
            <ScoreChart
              scores={filteredScores}
              gameId={currentGame.id}
              color={currentGame.color.replace('bg-', '')}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredScores.length} scores • {currentConfig.label}
          </p>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No scores in this date range
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 justify-center">
        {playedGames.map((game, index) => (
          <Button
            key={game.id}
            variant={index === currentGameIndex ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentGameIndex(index)}
            className="text-xs"
          >
            {game.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
