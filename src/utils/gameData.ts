import { Game, Player, Score, Connection } from './types';

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
    id: 'tightrope',
    name: 'Tightrope',
    description: 'Walk the trivia tightrope to make it to the other side!',
    icon: 'layout-grid',
    color: 'bg-blue-500',
    maxScore: 2340  // Updated from 5000 to 2340
  },
  {
    id: 'quordle',
    name: 'Quordle',
    description: 'Solve four Wordle-style puzzles at once.',
    icon: 'grid',
    color: 'bg-purple-500',
    maxScore: 36  // Updated from 9 to 36 (9 per word × 4 words)
  },
  {
    id: 'mini-crossword',
    name: 'Mini Crossword',
    description: 'Complete the NYT Mini Crossword puzzle as fast as you can.',
    icon: 'grid-3x3',
    color: 'bg-rose-500',
    maxScore: 300  // Updated from 600 to 300 seconds (5 minutes)
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
  
  games.forEach(game => {
    players.forEach(player => {
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Randomly skip some days (not every player plays every game every day)
        if (Math.random() > 0.7) continue;
        
        let value: number;
        if (game.id === 'mini-crossword') {
          // Generate random completion time between 45 seconds and 5 minutes (300 seconds)
          value = Math.floor(Math.random() * (300 - 45) + 45);
        } else if (game.id === 'tightrope') {
          // Generate random score between 0 and 2340 for Tightrope
          value = Math.floor(Math.random() * 2341);
        } else {
          value = Math.floor(Math.random() * (game.maxScore || 10));
        }
        
        scores.push({
          id: `score-${game.id}-${player.id}-${i}`,
          gameId: game.id,
          playerId: player.id,
          value,
          date: date.toISOString().split('T')[0],
          createdAt: date.toISOString() // Add createdAt 
        });
      }
    });
  });
  
  return scores;
};

export const sampleScores = generateSampleScores();

// Sample connections between players
export const connections: Connection[] = [
  {
    id: 'conn1',
    user_id: 'p1',
    friend_id: 'p2',
    status: 'accepted',
    created_at: new Date().toISOString()
  },
  {
    id: 'conn2',
    user_id: 'p1',
    friend_id: 'p3',
    status: 'accepted',
    created_at: new Date().toISOString()
  },
  {
    id: 'conn3',
    user_id: 'p2',
    friend_id: 'p3',
    status: 'pending',
    created_at: new Date().toISOString()
  }
];

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
  
  // For some games like Wordle and Mini Crossword, lower is better
  if (game.id === 'wordle' || game.id === 'mini-crossword') {
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

// Get player connections
export const getPlayerConnections = (playerId: string): Connection[] => {
  return connections.filter(conn => 
    (conn.user_id === playerId || conn.friend_id === playerId) && 
    conn.status === 'accepted'
  );
};

// Get player friends
export const getPlayerFriends = (playerId: string): Player[] => {
  const playerConnections = getPlayerConnections(playerId);
  const friendIds = playerConnections.map(conn => 
    conn.user_id === playerId ? conn.friend_id : conn.user_id
  );
  
  return players.filter(player => friendIds.includes(player.id));
};

// Add a new game
export const addGame = (game: Omit<Game, 'id'>): Game => {
  const newGame = {
    ...game,
    id: `game-${Date.now()}`,
    isCustom: true
  };
  
  games.push(newGame);
  return newGame;
};

// Add a new connection
export const addConnection = (playerId: string, friendId: string): Connection => {
  const newConnection = {
    id: `conn-${Date.now()}`,
    user_id: playerId,
    friend_id: friendId,
    status: 'pending',
    created_at: new Date().toISOString()
  } as Connection;
  
  connections.push(newConnection);
  return newConnection;
};

// Update getLabelByGame in GameCard to handle time-based scores
export const getLabelByGame = (gameId: string): string => {
  switch (gameId) {
    case 'wordle':
      return 'tries';
    case 'mini-crossword':
      return 'seconds';
    case 'quordle':
      return 'tries';
    default:
      return 'points';
  }
};
