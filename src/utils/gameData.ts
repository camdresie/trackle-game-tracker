
import { Game, Player, Score } from './types';

export const games: Game[] = [
  {
    id: 'wordle',
    name: 'Wordle',
    description: 'Guess the five-letter word in six tries.',
    icon: 'puzzle',
    color: 'bg-emerald-500',
    maxScore: 6
  },
  {
    id: 'crossword',
    name: 'Daily Crossword',
    description: 'Complete the crossword puzzle with clues.',
    icon: 'grid',
    color: 'bg-blue-500',
    maxScore: 100
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Fill the 9×9 grid with digits.',
    icon: 'layout-grid',
    color: 'bg-purple-500',
    maxScore: 100
  },
  {
    id: 'chess',
    name: 'Chess Puzzle',
    description: 'Solve the daily chess puzzle.',
    icon: 'sword',
    color: 'bg-amber-500',
    maxScore: 10
  }
];

export const players: Player[] = [
  {
    id: 'p1',
    name: 'Alex Chen',
    avatar: '/avatar1.png'
  },
  {
    id: 'p2',
    name: 'Morgan Smith',
    avatar: '/avatar2.png'
  },
  {
    id: 'p3',
    name: 'Jordan Lee',
    avatar: '/avatar3.png'
  }
];

// Generate sample scores for the last 30 days
export const generateSampleScores = (): Score[] => {
  const scores: Score[] = [];
  const now = new Date();
  
  // For each game and player, generate scores for the last 30 days
  games.forEach(game => {
    players.forEach(player => {
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Randomly skip some days (not every player plays every game every day)
        if (Math.random() > 0.7) continue;
        
        scores.push({
          id: `score-${game.id}-${player.id}-${i}`,
          gameId: game.id,
          playerId: player.id,
          value: Math.floor(Math.random() * game.maxScore),
          date: date.toISOString().split('T')[0]
        });
      }
    });
  });
  
  return scores;
};

export const sampleScores = generateSampleScores();

// Helper functions for working with the data
export const getGameById = (gameId: string): Game | undefined => {
  return games.find(game => game.id === gameId);
};

export const getPlayerById = (playerId: string): Player | undefined => {
  return players.find(player => player.id === playerId);
};

export const getScoresByGameId = (gameId: string): Score[] => {
  return sampleScores.filter(score => score.gameId === gameId);
};

export const getScoresByPlayerId = (playerId: string): Score[] => {
  return sampleScores.filter(score => score.playerId === playerId);
};

export const getScoresByGameAndPlayer = (gameId: string, playerId: string): Score[] => {
  return sampleScores.filter(score => score.gameId === gameId && score.playerId === playerId);
};

export const getLatestScoreByGameAndPlayer = (gameId: string, playerId: string): Score | undefined => {
  const scores = getScoresByGameAndPlayer(gameId, playerId);
  if (scores.length === 0) return undefined;
  
  // Sort by date (descending)
  return scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

export const calculateAverageScore = (scores: Score[]): number => {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score.value, 0);
  return Math.round((sum / scores.length) * 10) / 10;
};

export const calculateBestScore = (scores: Score[], game: Game): number => {
  if (scores.length === 0) return 0;
  
  // For some games like Wordle, lower is better
  if (game.id === 'wordle') {
    return Math.min(...scores.map(score => score.value));
  }
  
  // For most games, higher is better
  return Math.max(...scores.map(score => score.value));
};

// Dummy function to calculate player ranking
export const calculatePlayerRanking = (playerId: string): number => {
  // In a real app, this would be based on actual game performance
  // For this demo, we're just using a fixed ranking
  const rankings = {
    p1: 2,
    p2: 1,
    p3: 3
  };
  
  return rankings[playerId as keyof typeof rankings] || 0;
};
